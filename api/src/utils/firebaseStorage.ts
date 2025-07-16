import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { initializeFirebase } from "../config/firebase";

initializeFirebase();
const storage = getStorage();

/**
 * Faz upload de um arquivo para o Firebase Storage
 * @param fileBuffer
 * @param folder
 * @param fileName
 * @returns URL
 */
export const uploadFileToFirebase = async (fileBuffer: Buffer, folder: string, fileName: string): Promise<string> => {
  const storageRef = ref(storage, `${folder}${fileName}`);
  const snapshot = await uploadBytes(storageRef, fileBuffer);
  const downloadURL = await getDownloadURL(snapshot.ref);
  return downloadURL;
};

/**
 * Deleta um arquivo do Firebase Storage.
 * @param fileUrl url publica de arquivo a ser deletado
 */
export const deleteFileFromFirebase = async (fileUrl: string): Promise<void> => {
  try {
    const filrRef = ref(storage, fileUrl);
    await deleteObject(filrRef);
    console.log(`Arquivo ${fileUrl} deletado do Firebase Storage`);
  } catch (error: any) {
    if (error.code === "storage/object-not-found") {
      console.warn(`Tentativa de deletar arquivo não existente no Storage: ${fileUrl}`);
    } else {
      console.error(`Erro ao deletar arquivo do firebase Storage (${fileUrl})`);
      throw error;
    }
  }
};
