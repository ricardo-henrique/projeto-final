import { Router, Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { Post } from "../entity/Posts";
import { User } from "../entity/User";
import { Category } from "../entity/Category";
import authMiddleware, { adminAuthMiddleware } from "../middleware/auth";
import { uploadFileToFirebase, deleteFileFromFirebase } from "../utils/firebaseStorage";
import multer, { FileFilterCallback } from "multer";
import slugify from "slugify";

const imageFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    const error = new Error("Apenas arquivos de imagem são permitidos!");
    cb(error as any, false);
  }
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: imageFilter,
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
router.post("/", authMiddleware, upload.single("image"), async (req: Request, res: Response) => {
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
        return res.status(404).json({ message: "Categoria não encontrada" });
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

/**
 * @route GET /api/v1/posts
 * @description Obtem todos os posts (com paginação e filtros opcionais)
 * @access Public
 */

router.get("/", async (req: Request, res: Response) => {
  const { page = 1, limit = 10, categoryId, search, status } = req.body;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  try {
    const queryBuilder = postRepository
      .createQueryBuilder("post")
      .leftJoinAndSelect("post.author", "author")
      .leftJoinAndSelect("post.category", "category")
      .orderBy("post.createAt", "DESC")
      .skip(skip)
      .take(parseInt(limit as string));

    if (categoryId) {
      queryBuilder.andWhere("post.categoryId = :categoryId", { categoryId });
    }

    if (search) {
      queryBuilder.andWhere("(post.title LIKE :search OR post.content LIKE :search)", { search: `%${search}%` });
    }

    if (status) {
      queryBuilder.andWhere("post.status = :status", { status });
    }

    const [posts, total] = await queryBuilder.getManyAndCount();

    res.status(200).json({
      data: posts,
      total,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      totalPages: Math.ceil(total / parseInt(limit as string)),
    });
  } catch (error) {
    console.error("Erro ao obter posts:", error);
    res.status(500).json({ message: "Erro interno do servidor ao obter posts." });
  }
});

/**
 * @route GET /api/v1/posts/:slug
 * @description Obtém um post pelo slug
 * @access Public
 */
router.get("/:slug", async (req: Request, res: Response) => {
  const { slug } = req.params;

  try {
    const post = await postRepository.findOne({
      where: { slug },
      relations: ["author", "category"],
    });

    if (!post) {
      return res.status(404).json({ message: "Post não encontrado." });
    }
    res.status(200).json(post);
  } catch (error) {
    console.error("Erro ao obter post:", error);
    res.status(500).json({ message: "Erro interno do servidor ao obter post." });
  }
});

/**
 * @route PUT /api/v1/posts/:id
 * @description Atualiza um post existente (com upload de imagem opcional)
 * @access Private (Autor do post ou Admin)
 */
router.put("/:id", authMiddleware, upload.single("image"), async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, content, categoryId, status } = req.body;
  const userId = req.user?.id;

  try {
    const post = await postRepository.findOne({
      where: { id },
      relations: ["author", "category"],
    });

    if (!post) {
      return res.status(404).json({ message: "Post não encontrado." });
    }

    if (post.author.id !== userId && req.user?.role !== "Admin") {
      return res.status(403).json({ message: "Você não tem permissão para editar este post." });
    }

    let categoryInstance: Category | null = null;
    if (categoryId !== undefined && categoryId !== null && categoryId !== "") {
      const foundCategory = await categoryRepository.findOne({ where: { id: categoryId } });
      if (!foundCategory) {
        return res.status(404).json({ message: "Categoria não encontrada." });
      }
      categoryInstance = foundCategory;
    } else if (categoryId === null || categoryId === "") {
      categoryInstance = null;
    } else {
      categoryInstance = post.category;
    }

    if (title && title !== post.title) {
      const baseSlug = slugify(title, { lower: true, strict: true });
      let newSlug = baseSlug;
      let couter = 1;
      while (await postRepository.findOne({ where: { slug: newSlug } })) {
        newSlug = `${baseSlug}-${couter++}`;
      }
      post.slug = newSlug;
    }

    if (req.file) {
      if (post.imageUrl) {
        await deleteFileFromFirebase(post.imageUrl);
      }
      const fileExtension = req.file.originalname.split(".").pop();
      const fileName = `${Date.now()}-${post.slug}.${fileExtension}`;
      post.imageUrl = await uploadFileToFirebase(req.file.buffer, "post-images", fileName);
    } else if (req.body.removeImage === true && post.imageUrl) {
      await deleteFileFromFirebase(post.imageUrl);
      post.imageUrl = undefined;
    }

    post.title = title || post.title;
    post.content = content || post.content;
    post.status = status || post.status;
    post.category = categoryInstance;

    await postRepository.save(post);
    res.status(200).json(post);
  } catch (error: any) {
    if (error.message === "Apenas arquivos de imagem são permitidos!") {
      return res.status(400).json({ message: error.message });
    }
    console.error("Erro ao atualizar post:", error);
    res.status(500).json({ message: "Erro interno do servidor ao atualizar post." });
  }
});

/**
 * @route DELETE /api/v1/posts/:id
 * @desc Deleta um post e sua imagem associada no Firebase
 * @access Private (Autor do post ou Admin)
 */
router.delete("/:id", authMiddleware, async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  try {
    const post = await postRepository.findOne({ where: { id }, relations: ["author"] });
    if (!post) {
      return res.status(404).json({ message: "Post não encontrado" });
    }

    if (post.author.id !== userId && req.user?.role !== "admin") {
      return res.status(403).json({ message: "Você não tem permissão para deletar este post." });
    }

    if (post.imageUrl) {
      await deleteFileFromFirebase(post.imageUrl);
    }

    await postRepository.remove(post);
    res.status(204).send();
  } catch (error) {
    console.error("Erro ao deletar post:", error);
    res.status(500).json({ message: "Erro interno do servidor ao deletar post." });
  }
});

export default router;
