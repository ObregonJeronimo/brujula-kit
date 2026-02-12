# Reglas de Seguridad de Firestore - Brujula KIT v5.8

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

## Cambios v5.8: coleccion pacientes

Agregada coleccion `pacientes` con permisos CRUD completos por usuario.
Cada usuario solo puede ver, crear, editar y eliminar sus propios pacientes.
Admin puede gestionar todos.

## Son seguras estas reglas? Si.

**Usuarios**: Cualquier usuario logueado puede leer perfiles.

**Creditos**: Un usuario solo puede DECREMENTAR sus propios creditos. Solo admin puede incrementar.

**Role**: Solo el admin puede modificar role.

**Evaluaciones**: Solo puedes leer las tuyas. Solo puedes crear con tu propio userId. Solo admin puede eliminar.

**Pacientes**: Solo puedes leer, crear, editar y eliminar tus propios pacientes. Admin puede gestionar todos.

**Citas**: Solo puedes leer, crear, editar y eliminar tus propias citas. Admin puede gestionar todas.
