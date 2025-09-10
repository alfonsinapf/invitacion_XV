export default async function handler(req, res) {
  res.status(200).json({ message: "✅ API funciona!", timestamp: new Date() });
}
