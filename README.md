# 🧭 Brújula KIT

Sistema Integral de Evaluación Fonoaudiológica.

## Herramientas

- **ELDI** — Evaluación del Lenguaje y Desarrollo Infantil (0–7;11 años)
- **PEFF** — Protocolo de Evaluación Fonética-Fonológica (2;6–6;11 años)

## Stack

- React 18 + Vite
- Firebase Firestore (persistencia)
- PDF export (print-to-PDF nativo)

## Setup

1. `npm install`
2. Crear `.env.local` con variables Firebase (ver `.env.example`)
3. `npm run dev`

## Deploy

Netlify auto-deploy desde branch `main`.
Configurar variables de entorno Firebase en Netlify → Site settings → Environment variables.
