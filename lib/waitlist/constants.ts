export const ALLOWED_COUNTRIES = [
  { value: 'nigeria', label: 'Nigeria' },
  { value: 'ghana', label: 'Ghana' },
  { value: 'kenya', label: 'Kenya' },
  { value: 'south_africa', label: 'South Africa' },
  { value: 'rwanda', label: 'Rwanda' },
  { value: 'egypt', label: 'Egypt' },
  { value: 'uganda', label: 'Uganda' },
  { value: 'other_africa', label: 'Other African country' },
  { value: 'other', label: 'Elsewhere' },
] as const;

export const ALLOWED_TRACKS = [
  { value: 'software_engineering', label: 'Software Engineering' },
  { value: 'frontend', label: 'Frontend Development' },
  { value: 'backend', label: 'Backend Development' },
  { value: 'fullstack', label: 'Full Stack Development' },
  { value: 'mobile', label: 'Mobile Engineering' },
  { value: 'product_design', label: 'Product Design (UI/UX)' },
  { value: 'product_management', label: 'Product Management' },
  { value: 'data_ai', label: 'Data & AI / ML' },
  { value: 'devops_cloud', label: 'DevOps & Cloud' },
  { value: 'qa_testing', label: 'QA & Testing' },
  { value: 'other', label: 'Other craft' },
] as const;

export const ALLOWED_PRIORITIES = [
  'Purpose',
  'Remote work',
  'Fair pay',
  'Growth',
  'Stable team',
  'Flexible hours',
] as const;

export type CountryValue = typeof ALLOWED_COUNTRIES[number]['value'];
export type TrackValue = typeof ALLOWED_TRACKS[number]['value'];
export type PriorityValue = typeof ALLOWED_PRIORITIES[number];
