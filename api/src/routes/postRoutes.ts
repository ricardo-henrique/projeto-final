import { Router, Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { Post } from "../entity/Posts";
import { User } from "../entity/User";
import { Category } from "../entity/Category";
import authMiddleware, { adminAuthMiddleware } from "../middleware/auth";
import { uploadFileToFirebase, deleteFileFromFirebase } from "../utils/firebaseStorage";
import multer from "multer";
import slugify from "slugify";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      const error = new Error("Apenas arquivos de imagem são permitidos!");
      cb(error as any, false);
    }
  },
});

const router = Router();
const postRepository = AppDataSource.getRepository(Post);
const userRepository = AppDataSource.getRepository(User);
const categoryRepository = AppDataSource.getRepository(Category);

/**
 * @route POST /api/v1/posts
 * @description Cria um novo post (com upload de imagem)
 * @access Private
 */
router.post("/", adminAuthMiddleware, upload.single("image"), async (req: Request, res: Response) => {
  const { title, content, categoryId, status } = req.body;
  const authorId = req.user?.id;

  if (!title || !content || !authorId) {
    return res.status(400).json({ message: "Titulo, conteúdo e autor são obrigatórios" });
  }

  try {
    const author = await userRepository.findOne({ where: { id: authorId } });
    if (!author) {
      return res.status(400).json({ message: "Autor não encontrado." });
    }

    let categoryInstance: Category | null = null;
    if (categoryId) {
      const foundCategory = await categoryRepository.findOne({ where: { id: categoryId } });
      if (!foundCategory) {
        return res.status(404).json({ message: "Categoria nã encontrada" });
      }
      categoryInstance = foundCategory;
    }
    const baseSlug = slugify(title, { lower: true, strict: true });
    let slug = baseSlug;
    let counter = 1;
    while (await postRepository.findOne({ where: { slug } })) {
      slug = `${baseSlug}-${counter++}`;
    }

    let imageUrl: string | undefined;
    if (req.file) {
      const fileExtention = req.file.originalname.split(".").pop();
      const fileName = `${Date.now()}-${slug}.${fileExtention}`;
      imageUrl = await uploadFileToFirebase(req.file.buffer, "post-images/", fileName);
    }

    const newPost = postRepository.create({
      title,
      slug,
      content,
      imageUrl,
      status: status || "draft",
      author: author,
      category: categoryInstance,
    });

    await postRepository.save(newPost);
    res.status(201).json(newPost);
  } catch (error: any) {
    if (error.message === "Apenas arquivos de imagem são permitidos!") {
      return res.status(400).json({ message: error.message });
    }
    console.error("Erro ao criar post:", error);
    res.status(500).json({ message: "Erro interno do servidor ao criar post" });
  }
});
