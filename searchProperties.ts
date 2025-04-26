export async function searchProperties(term: string) {
  console.log("Mock search running for:", term);

  await new Promise(resolve => setTimeout(resolve, 300)); // tiny fake delay

  // Hardcoded property list
  const properties = [
    {
      id: 1,
      address: "123 Main St",
      city: "Yourtown",
      state: "FL",
      zip: "34211"
    },
    {
      id: 2,
      address: "456 Elm Ave",
      city: "Othertown",
      state: "TX",
      zip: "75001"
    }
  ];

  // 🔥 This is the new part:
  // Only return properties that match the search term
  return properties.filter(property =>
    property.address.toLowerCase().includes(term.toLowerCase()) ||
    property.city.toLowerCase().includes(term.toLowerCase()) ||
    property.state.toLowerCase().includes(term.toLowerCase()) ||
    property.zip.includes(term)
  );
}
