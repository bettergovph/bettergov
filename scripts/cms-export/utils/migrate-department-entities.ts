/**
 * Export key mapping for department entity types
 * Maps entity_type values stored in the CMS to the JSON export field names
 */

/**
 * Export mapping: entity_type -> JSON export field name
 */
export const ENTITY_TYPE_TO_EXPORT_KEY: Record<string, string> = {
  under_supervision_and_control: 'under_supervision_and_control',
  under_administrative_supervision: 'under_administrative_supervision',
  foreign_service_establishment: 'foreign_service_establishments',
  philippine_mission: 'philippine_missions',
  hospital_medical_center:
    'doh_hospitals_special_medical_centers_and_institute_for_disease_prevention',
  regional_prosecutor_office: 'offices_of_the_regional_prosecutor',
  collegial_scientific_body: 'collegial_and_scientific_bodies',
  research_development_institute: 'research_and_development_institutes',
  scientific_technological_service: 'scientific_and_technological_services',
  sectoral_planning_council: 'sectoral_planning_councils',
  migrant_workers_office: 'migrant_workers_offices',
};
