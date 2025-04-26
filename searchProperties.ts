export async function searchProperties(term: string) {
  console.log("Mock search running for:", term);

  await new Promise(resolve => setTimeout(resolve, 300));

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

  const filtered = properties.filter(property =>
    property.address.toLowerCase().includes(term.toLowerCase()) ||
    property.city.toLowerCase().includes(term.toLowerCase()) ||
    property.state.toLowerCase().includes(term.toLowerCase()) ||
    property.zip.includes(term)
  );

  // 🛠️ Wrapped inside { results: [...] }
  return { results: filtered };
}
