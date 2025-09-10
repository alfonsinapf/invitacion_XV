import { useState, useEffect } from 'react';
import { collection, addDoc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { motion, AnimatePresence } from 'framer-motion';

export default function GuestBook() {
  const [messages, setMessages] = useState([]);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');

  // Mensajes en tiempo real
  useEffect(() => {
    const q = query(collection(db, "guestbook"), orderBy("date", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => doc.data());
      setMessages(msgs);
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !message) return;

    await addDoc(collection(db, "guestbook"), {
      name,
      message,
      date: new Date()
    });

    setName('');
    setMessage('');
  };

  return (
    <div className="max-w-3xl mx-auto p-4 bg-white rounded-xl shadow-lg mt-8">
      <h2 className="text-2xl font-bold text-center mb-2">💌 Deja tu mensaje para Alfonsina</h2>
      <p className="text-center text-pink-500 font-semibold mb-4">Total de mensajes: {messages.length} 🎉</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 mb-6">
        <input
          type="text"
          placeholder="Tu nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400"
        />
        <textarea
          placeholder="Tu mensaje de cariño"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400 resize-none"
          rows={4}
        />
        <button
          type="submit"
          className="bg-pink-500 text-white py-2 px-6 rounded-full font-bold hover:bg-pink-400 transition"
        >
          ✨ Enviar
        </button>
      </form>

      <AnimatePresence>
        {messages.length === 0 ? (
          <motion.p
            className="text-gray-500 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            ¡Sé el primero en dejarle un mensaje! 💖
          </motion.p>
        ) : (
          messages.map((msg, index) => (
            <motion.div
              key={index}
              className="p-3 border-l-4 border-pink-500 bg-pink-50 rounded-lg mb-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <p className="text-gray-700"><span className="font-bold">{msg.name}:</span> {msg.message} 💌</p>
              <p className="text-gray-400 text-sm mt-1">{new Date(msg.date.seconds * 1000).toLocaleString()}</p>
            </motion.div>
          ))
        )}
      </AnimatePresence>
    </div>
  );
}
