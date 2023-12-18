// 10% punktów: Dane muszą zawierać co najmniej 4 tabele, jenda relacja OneToOne i jedna relacja OneToMany (lub ManyToMany).
// JEST: danefinansowe (1-m), firma (1-1), firmakategoria (many - many), kategoria (1-m)

const express = require('express');
// 20% punktów: Aplikacja powinna wykorzystywać bazę danych nie zapisywaną w pamięci, czyli np. PostgreQSL, MyQSL, ORACLE itp.
const pool = require('./db');

const app = express();
const port = 3000;

app.use(express.json());

// 20% punktów: Program powinien posiadać endpointy REST-owe do tworzenia, odczytu, edycji, usuwania obiektów z bazy danych,
// 25% punktów: 1/4 Jedno z zapytań musi być stronicowane.
app.get('/api/company', async (req, res) => {
  try {
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);
    const offset = (page - 1) * limit;

    if (!page || !limit) res.json(await pool.query('SELECT * FROM Firma'))
    const result = await pool.query('SELECT * FROM Firma ORDER BY id LIMIT $1 OFFSET $2', [limit, offset]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 25% punktów: Należy użyć w projekcie pola do zapisu daty - najlepiej ZonedDateTime lub JodaTime.
app.post('/api/company', async (req, res) => {
  try {
    const { nazwa, branża, kraj } = req.body;
    const id = Math.floor(Math.random() * 1000000) + 1;

    let text = 'INSERT INTO Firma(id, nazwa';
    let values = [id, nazwa];
    let params = ['$1', '$2'];

    if (kraj) {
      text += ', kraj';
      params.push(`$${params.length + 1}`);
      values.push(kraj);
    }

    if (branża) {
      text += ', branża';
      params.push(`$${params.length + 1}`);
      values.push(branża);
    }

    text += `) VALUES(${params.join(', ')}) RETURNING *`;

    const query = {
      text,
      values,
    };

    const result = await pool.query(query);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 25% punktów: 2/4 Zapytań musi być co najmniej 3
app.get('/api/company/:id', async (req, res) => {
  try {
    const itemId = parseInt(req.params.id);

    const query = {
      text: 'SELECT * FROM Firma WHERE id = $1',
      values: [itemId],
    };

    const result = await pool.query(query);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 25% punktów: 3/4 co najmniej jedno powinno być stworozne jako zapytanie @Query z parametrem.
app.patch('/api/company/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { nazwa, branża, kraj } = req.body;

    let queryText = 'UPDATE Firma SET';
    let updateValues = [];
    let valueIndex = 1;

    if (nazwa !== undefined) {
      queryText += ` nazwa = $${valueIndex},`;
      updateValues.push(nazwa);
      valueIndex++;
    }

    if (branża !== undefined) {
      queryText += ` branża = $${valueIndex},`;
      updateValues.push(branża);
      valueIndex++;
    }

    if (kraj !== undefined) {
      queryText += ` kraj = $${valueIndex},`;
      updateValues.push(kraj);
      valueIndex++;
    }

    queryText = queryText.slice(0, -1) + ` WHERE id = $${valueIndex} RETURNING *`;
    updateValues.push(id);

    const query = {
      text: queryText,
      values: updateValues,
    };

    const result = await pool.query(query);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
})

app.delete('/api/company/:id', async (req, res) => {
  try {
    const itemId = parseInt(req.params.id);

    const query = {
      text: 'DELETE FROM Firma WHERE id = $1',
      values: [itemId],
    };

    await pool.query(query);

    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/financial/:id', async (req, res) => {
  try {
    const itemId = parseInt(req.params.id);

    const query = {
      text: 'SELECT nazwa, przychody, zysknetto FROM DaneFinansowe INNER JOIN Firma ON DaneFinansowe.id_firmy = Firma.id WHERE DaneFinansowe.id_firmy = $1',
      values: [itemId],
    };

    const result = await pool.query(query);

    res.json(result.rows);
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
})

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
