const admin = require('firebase-admin');
const fs = require('fs');
const csv = require('csv-parser');

const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const firestore = admin.firestore();

fs.createReadStream('expenses.csv')
  .pipe(csv())
  .on('data', async (row) => {
    try {
      const { amount, category, date, description, paymentMethod, userId } = row;

      const expensesRef = firestore.collection('expenses');

      const existingSnapshot = await expensesRef
        .where('userId', '==', userId)
        .where('date', '==', date)
        .where('amount', '==', Number(amount))
        .where('description', '==', description)
        .limit(1)
        .get();

      if (existingSnapshot.empty) {
        await expensesRef.add({
          amount: Number(amount),
          category,
          date,
          description,
          paymentMethod,
          userId,
        });
        console.log(` Added: ${description} (${amount} TK)`);
      } else {
        console.log(` Skipped duplicate: ${description} (${amount} TK)`);
      }
    } catch (error) {
      console.error('Error processing row:', row, error);
    }
  })
  .on('end', () => {
    console.log('CSV import completed.');
  });
