# Reglas de Seguridad de Firestore - Brujula KIT v5.9

## Reglas DEFINITIVAS (copiar y pegar en Firebase Console)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAdmin() {
      return request.auth != null &&
        get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.role == "admin";
    }

    match /usuarios/{userId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == userId;
      allow update: if request.auth != null && (
        isAdmin() ||
        (request.auth.uid == userId &&
         !request.resource.data.diff(resource.data).affectedKeys().hasAny(['role']) &&
         (
           !request.resource.data.diff(resource.data).affectedKeys().hasAny(['creditos']) ||
           (request.resource.data.creditos < resource.data.creditos &&
            request.resource.data.creditos >= 0)
         )
        )
      );
      allow delete: if isAdmin();
    }

    match /evaluaciones/{evalId} {
      allow read: if request.auth != null &&
        (resource.data.userId == request.auth.uid || isAdmin());
      allow create: if request.auth != null &&
        request.resource.data.userId == request.auth.uid;
      allow delete: if isAdmin();
    }

    match /peff_evaluaciones/{evalId} {
      allow read: if request.auth != null &&
        (resource.data.userId == request.auth.uid || isAdmin());
      allow create: if request.auth != null &&
        request.resource.data.userId == request.auth.uid;
      allow delete: if isAdmin();
    }

    match /rep_evaluaciones/{evalId} {
      allow read: if request.auth != null &&
        (resource.data.userId == request.auth.uid || isAdmin());
      allow create: if request.auth != null &&
        request.resource.data.userId == request.auth.uid;
      allow delete: if isAdmin();
    }

    match /pacientes/{pacienteId} {
      allow read: if request.auth != null &&
        (resource.data.userId == request.auth.uid || isAdmin());
      allow create: if request.auth != null &&
        request.resource.data.userId == request.auth.uid;
      allow update: if request.auth != null &&
        (resource.data.userId == request.auth.uid || isAdmin());
      allow delete: if request.auth != null &&
        (resource.data.userId == request.auth.uid || isAdmin());
    }

    match /citas/{citaId} {
      allow read: if request.auth != null &&
        (resource.data.userId == request.auth.uid || isAdmin());
      allow create: if request.auth != null &&
        request.resource.data.userId == request.auth.uid;
      allow update: if request.auth != null &&
        (resource.data.userId == request.auth.uid || isAdmin());
      allow delete: if request.auth != null &&
        (resource.data.userId == request.auth.uid || isAdmin());
    }
  }
}
```

## Cambios v5.9: coleccion rep_evaluaciones

Agregada coleccion `rep_evaluaciones` para la herramienta Repeticion de Palabras (PEFF 3.2).
Mismos permisos que evaluaciones y peff_evaluaciones: read/create own, delete admin only.

## IMPORTANTE: Copiar las reglas de arriba y pegarlas en Firebase Console > Firestore Database > Rules > Publish
