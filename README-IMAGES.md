# Images du launcher NindoCraft — gestion depuis GitHub

Dépôt cible public : ShaoJun18/NindoCraft-Modpack. Nécessite le launcher 1.0.21 une fois.

## Mise en place

1. Décompresser le paquet puis déposer son CONTENU à la racine du dépôt existant, sur main. Conserver les chemins images/, scripts/ et .github/workflows/. Ne pas remplacer ton README existant.
2. Activer GitHub Actions si demandé, puis ouvrir Actions → Mettre à jour les images du launcher. Le workflow demande uniquement contents:write pour remplacer launcher-assets.json dans la release Latest existante. Aucun token personnel ni secret à configurer.
3. Si le workflow ne s’exécute pas après l’envoi, cliquer Run workflow sur main. Une release publique normale doit déjà exister (modpack-1.0.1 actuellement). Le workflow n’en crée aucune et ne change pas Latest.
4. Vérifier que le workflow passe au vert, puis installer une fois NindoCraft Launcher 1.0.21 et le redémarrer.

## Remplacer une image depuis le site GitHub

Ouvrir images/ puis le sous-dossier concerné, Add file → Upload files, envoyer la nouvelle image avec EXACTEMENT le même nom et valider le commit sur main. Actions calcule taille et SHA-256 puis remplace uniquement launcher-assets.json dans la release Latest. Relancer le launcher : le cache sera mis à jour. Aucun rebuild, ZIP de mods ou calcul de hash manuel.

- images/backgrounds/0.jpg à 7.jpg : huit fonds partagés.
- images/backgrounds/welcome.jpg, account.jpg, main.jpg, settings.jpg, optional-mods.jpg, loading.jpg : fonds propres à chaque écran ; enabled:false par défaut dans images/config.json, à passer à true si souhaité. Ils prennent alors priorité sur les fonds partagés.
- images/logos/welcome.png, main.png, loading.png, settings.png : quatre illustrations.
- images/logos/banner.png : bannière, désactivée par défaut ; enabled:true pour l’afficher.
- images/icons/optional-mods.png, settings.png, discord.png, link.png, account.png : icônes des boutons/section.
- images/icons/application.png : icône de la fenêtre du launcher ouverte. L’icône intégrée à l’EXE, à l’installateur et aux raccourcis Windows demande toujours un build signé si nécessaire ; ce fichier ne réécrit aucun exécutable.
- images/icons/mods/<id>.png : dix icônes de mods, prioritaires sur celles du catalogue optionnel pour les IDs correspondants. Les avatars Minecraft personnels ne sont pas remplacés.

28 emplacements actifs ; 7 facultatifs (six fonds par écran et la bannière). Les pictogrammes de contrôle de fenêtre et de formulaire restent des formes SVG/CSS de l’interface. Les anciens fichiers inutilisés ne sont pas exposés comme nouvelles images.

PNG/JPG/WebP seulement : conserver l’extension correcte ou modifier file dans images/config.json. SVG/HTML distants refusés. Fonds recommandés : 1920×1080 ; logos/icônes : PNG transparent. Maximum 20 Mio, 8192 pixels par dimension et 32 mégapixels.

Pour annuler : désactiver l’entrée avec enabled:false ou remettre l’ancien fichier dans GitHub. Les fichiers utilisent une URL raw liée au commit exact et sont vérifiés par hash/taille et décodage. Une image corrompue conserve la précédente ; si aucun cache utilisable n’existe, la ressource locale sert de secours. Au premier démarrage, l’écran initial utilise le secours jusqu’à la disponibilité des fichiers ; les démarrages suivants lisent le cache dès le chargement.

Le manifeste reste accessible ici : https://github.com/ShaoJun18/NindoCraft-Modpack/releases/latest/download/launcher-assets.json
Les images sont lues via https://raw.githubusercontent.com/ShaoJun18/NindoCraft-Modpack/<commit>/images/<fichier>

Les nouvelles releases normales du modpack déclenchent aussi le workflow : il reprend les images de main pour actualiser leur manifeste dans Latest. Aucun fichier version.json, manifest.json, modpack.zip ou optional-mods.json n’est modifié. Ne pas donner à une nouvelle release de modpack le nom launcher-images ; les fichiers d’images restent indépendants de sa version.

Documentation : https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax
