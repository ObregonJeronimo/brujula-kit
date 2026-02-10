# Firestore Security Rules - Brujula KIT

## IMPORTANTE: Configurar en Firebase Console

Ve a **Firebase Console > Firestore Database > Rules** y pega estas reglas:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /usuarios/{userId} {
      allow read: if request.auth != null && (request.auth.uid == userId || isAdmin());
      allow create: if request.auth != null && request.auth.uid == userId;
      allow update: if request.auth != null && (
        (request.auth.uid == userId &&
         !request.resource.data.diff(resource.data).affectedKeys().hasAny(['creditos', 'role'])) ||
        isAdmin()
      );
      allow delete: if isAdmin();
    }
    match /evaluaciones/{evalId} {
      allow read: if request.auth != null && (resource.data.userId == request.auth.uid || isAdmin());
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid && hasCredits();
      allow delete: if isAdmin();
    }
    match /peff_evaluaciones/{evalId} {
      allow read: if request.auth != null && (resource.data.userId == request.auth.uid || isAdmin());
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid && hasCredits();
      allow delete: if isAdmin();
    }
    function isAdmin() {
      return get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.role == "admin";
    }
    function hasCredits() {
      let userData = get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data;
      return userData.role == "admin" || userData.creditos > 0;
    }
  }
}
```

## Habilitar Firebase Authentication

1. Firebase Console > Authentication > Sign-in method
2. Habilita Email/Password
3. En Templates, personaliza el email de verificacion

## Crear el primer admin

1. El primer usuario con email `calaadmin976@brujulakit.com` sera admin automaticamente
2. O registra cualquier cuenta y en Firestore cambia `role` a `"admin"`

## Estructura

- usuarios/{uid}: { uid, email, nombre, apellido, dni, username, creditos:5, role, profileComplete, createdAt }
- evaluaciones/{autoId}: { userId, paciente, ... }
- peff_evaluaciones/{autoId}: { userId, paciente, ... }

## Seguridad

- Las API keys de Firebase son publicas por diseno
- La seguridad real esta en las Firestore Security Rules (servidor)
- Nadie puede modificar sus creditos desde el frontend
- Solo admin puede: ver todas las evaluaciones, gestionar creditos, eliminar usuarios
