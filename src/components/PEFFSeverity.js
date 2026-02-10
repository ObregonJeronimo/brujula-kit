/* PCC Severity Classification
 * Based on: Shriberg, L.D. & Kwiatkowski, J. (1982).
 * "Phonological disorders III: A procedure for assessing severity of involvement."
 * Journal of Speech and Hearing Disorders, 47(3), 256-270.
 *
 * The PCC (Percentage of Consonants Correct) is the international standard
 * metric for quantifying severity of speech sound disorders (TSH).
 * It is calculated as the percentage of consonants produced correctly
 * out of the total consonants evaluated.
 *
 * Classification cutoffs:
 *   Adecuado:        PCC = 100%
 *   Leve:            PCC 85-99%
 *   Leve-Moderado:   PCC 65-84%
 *   Moderado-Severo:  PCC 50-64%
 *   Severo:          PCC < 50%
 *
 * Note: The original Shriberg & Kwiatkowski (1982) system uses the terms
 * Mild, Mild-Moderate, Moderate-Severe, and Severe. We use the Spanish
 * equivalents adapted for clinical use in Latin America.
 *
 * This system does NOT use percentiles. The PCC is a criterion-referenced
 * measure (not norm-referenced), meaning it compares the child's production
 * against the target language system, not against a population distribution.
 */

export const PCC_SEVERITY = {
  classify: (pccPercent) => {
    if (pccPercent >= 100) return "Adecuado";
    if (pccPercent >= 85) return "Leve";
    if (pccPercent >= 65) return "Leve-Moderado";
    if (pccPercent >= 50) return "Moderado-Severo";
    return "Severo";
  },
  descriptions: {
    "Adecuado": "PCC = 100%: Producción correcta de todos los fonemas evaluados. No se observan dificultades articulatorias.",
    "Leve": "PCC 85–99%: Errores articulatorios aislados que no comprometen significativamente la inteligibilidad del habla.",
    "Leve-Moderado": "PCC 65–84%: Errores articulatorios múltiples que afectan parcialmente la inteligibilidad. Se recomienda intervención.",
    "Moderado-Severo": "PCC 50–64%: Errores articulatorios frecuentes que comprometen la inteligibilidad del habla. Requiere intervención.",
    "Severo": "PCC <50%: Errores articulatorios generalizados que comprometen severamente la inteligibilidad. Requiere intervención intensiva."
  },
  colors: {
    "Adecuado": "#059669",
    "Leve": "#84cc16",
    "Leve-Moderado": "#f59e0b",
    "Moderado-Severo": "#ea580c",
    "Severo": "#dc2626"
  },
  reference: "Shriberg, L.D. & Kwiatkowski, J. (1982). Phonological disorders III: A procedure for assessing severity of involvement. Journal of Speech and Hearing Disorders, 47(3), 256-270."
};
