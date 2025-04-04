export async function generateStaticParams() {
  const passwordIds = await fetchPasswordIds();
  
  return passwordIds.map((id) => ({
    id: id.toString(),
  }));
}

// This is a placeholder implementation - replace with your actual data fetching logic
export async function fetchPasswordIds() {
  // In a real app, you would fetch these from your database or API
  // For now, return some dummy IDs for static generation
  return ['1', '2', '3'];
}