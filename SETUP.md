# Gestion de Caisse – Configuration et démarrage

## 1. Base de données

- Exécuter tout le script SQL fourni dans **phpMyAdmin** (base `gestion_caisse`).
- Optionnel : ajouter une colonne `role` pour distinguer admin / user :
  ```sql
  ALTER TABLE utilisateurs ADD COLUMN role ENUM('user','admin') DEFAULT 'user' AFTER is_active;
  ```
- Créer au moins un utilisateur et des motifs/caisses pour tester :
  ```sql
  INSERT INTO utilisateurs (username, email, password_hash, nom_complet) 
  VALUES ('admin', 'admin@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrateur');
  -- Mot de passe: password

  INSERT INTO motifs (nom, type) VALUES ('Vente', 'entree'), ('Achat', 'sortie'), ('Frais', 'sortie');
  INSERT INTO caisses (nom, code, solde_initial, responsable_id) VALUES ('Caisse principale', 'CP01', 0, 1);
  ```

## 2. Backend (API PHP)

- L’API est dans `backend/api/`. Elle doit être servie par un serveur web (XAMPP Apache ou PHP built-in).
- **Avec XAMPP** : placer le projet dans `htdocs` et ouvrir :
  - `http://localhost/Projet%20de%20stage/backend/api/`
- Vérifier que `backend/.env` contient les bonnes valeurs (MySQL, `APP_KEY` généré avec `php artisan key:generate`).
- Pour Laravel (page d’accueil) : `cd backend && php artisan serve` → `http://127.0.0.1:8000` (l’API reste sur XAMPP si vous l’utilisez).

## 3. Frontend (React)

- Créer `frontend/.env` à partir de `frontend/.env.example` et adapter `REACT_APP_API_URL` si besoin (même URL que l’API ci-dessus).
- Démarrer : `cd frontend && npm install && npm start` → `http://localhost:3000`.
- Se connecter avec un utilisateur créé en base (ex. `admin` / `password` si vous avez utilisé le hash ci-dessus).

## 4. Résumé des URLs

| Service   | URL typique |
|----------|-------------|
| API      | `http://localhost/Projet%20de%20stage/backend/api` (XAMPP) |
| Frontend | `http://localhost:3000` (npm start) |

Si l’API est sur un autre domaine/port, mettre à jour `REACT_APP_API_URL` dans `frontend/.env`.
