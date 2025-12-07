// utils/fileManager.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Convertir le chemin du module en chemin absolu
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Sauvegarde des données dans un fichier JSON.
 * @param {Object|Array} data - Données à sauvegarder.
 * @param {string} filename - Nom du fichier (sans extension).
 * @param {string} [subfolder='exports'] - Sous-dossier dans `data/`.
 */
export const saveToJson = (data, filename, subfolder = 'exports') => {
  const dir = path.join(__dirname, '../data', subfolder);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const filePath = path.join(dir, `${filename}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  return filePath; // Retourne le chemin du fichier sauvegardé
};

/**
 * Lit un fichier JSON.
 * @param {string} filename - Nom du fichier (sans extension).
 * @param {string} [subfolder='imports'] - Sous-dossier dans `data/`.
 * @returns {Object|Array} - Données lues.
 */
export const readFromJson = (filename, subfolder = 'imports') => {
  const filePath = path.join(__dirname, '../data', subfolder, `${filename}.json`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Fichier introuvable : ${filePath}`);
  }
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(fileContent);
};
