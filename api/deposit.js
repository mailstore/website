// file: api/deposit.js
import { MongoClient } from 'mongodb';
import fetch from 'node-fetch';

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

export default async function handler(request, response) {
  const { nominal, whatsappNumber, productName } = request.query;

  // Pastikan semua parameter yang dibutuhkan ada
  if (!nominal || !whatsappNumber || !productName) {
    return response.status(400).json({ error: 'Nominal, whatsappNumber, and productName are required' });
  }

  const apikey = process.env.ATLANTIC_API_KEY; 
  const api_url = `https://atlantic-pedia-api.vercel.app/api/deposit?api_key=${apikey}&nominal=${nominal}`;

  try {
    const apiResponse = await fetch(api_url);
    const result = await apiResponse.json();

    if (result.status) {
      // Data yang akan disimpan ke MongoDB
      const document = {
        whatsappNumber: whatsappNumber,
        productName: productName, // Menambahkan nama produk
        productNominal: parseInt(nominal),
        apiResponseData: result.data,
        timestamp: new Date()
      };

      await client.connect();
      const database = client.db("atlanticpedia_db");
      const collection = database.collection("transactions");
      
      await collection.insertOne(document);
      
      console.log('Data saved to MongoDB successfully.');
    }

    response.status(200).json(result);
  } catch (error) {
    console.error('API request or MongoDB operation failed:', error);
    response.status(500).json({ error: 'Failed to process the request' });
  } finally {
    // Tutup koneksi setelah selesai
    await client.close();
  }
}
