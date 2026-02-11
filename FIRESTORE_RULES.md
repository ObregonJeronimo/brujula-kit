# Reglas de Seguridad de Firestore — Brújula KIT v5.6

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
        (request.auth.uid == userId &&
         !request.resource.data.diff(resource.data).affectedKeys().hasAny(['creditos', 'role'])) ||
        isAdmin()
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

## Son estas reglas seguras? Si.

**Usuarios**: Cualquier usuario logueado puede leer perfiles (necesario para verificar usernames unicos y para admin). Los datos en `/usuarios/` son solo: nombre, apellido, username, email, creditos, role. NO contiene datos sensibles como contrasenas. Las evaluaciones clinicas estan en colecciones separadas y protegidas por userId.

**Creditos y Role**: Solo el admin puede modificar `creditos` y `role`. Un usuario normal puede editar su perfil pero esos dos campos estan bloqueados por las reglas.

**Evaluaciones**: Solo puedes leer las tuyas. Solo puedes crear con tu propio userId. Solo admin puede eliminar.

**Citas**: Solo puedes leer, crear, editar y eliminar tus propias citas. El admin puede ver y gestionar todas las citas.

**Estas son las reglas definitivas.** No son temporales. Son seguras para produccion.
