export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

export const topicLabels: Record<string, string> = {
  'design-leadership': 'Design Leadership',
  reflections: 'Reflections',
};
