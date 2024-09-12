const publishedYearSchemaDefinition = {
    published_year: { type: 'integer', minimum: 0, maximum: new Date().getFullYear() }
}

const bookRoutes = async(fastify) => {
    // Middleware di autenticazione JWT
    fastify.decorate("authenticate", async function (request, reply) {
        const authHeader = request.headers['authorization'];

        if (!authHeader) {
            return reply.code(401).send({ message: 'Authorization header missing' });
        }

        const token = authHeader.split(' ')[1]; // Rimuovi il prefisso 'Bearer'

        try {
            // Chiamata al server di autenticazione per verificare il token
            const response = await fetch('http://localhost:3001/auth/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token }),
            });

            
            const data = await response.json();
            
            console.log('********response', data)
            if (data.valid) {
                request.user = data.decoded;  // Aggiungi l'utente decodificato alla richiesta
            } else {
            return reply.code(401).send({ message: 'Invalid token' });
            }
        } catch (error) {
            console.log(error)
            return reply.code(401).send({ message: 'Token verification failed' });
        }
    });
    
    // Middleware di autorizzazione per risorse specifiche
    fastify.decorate("authorize", (allowedResources) => {
        return async (request, reply) => {
            const user = request.user;
        
            if (!allowedResources.includes(user.permissions)) {
            return reply.code(403).send({ message: 'Access denied' });
            }
        };
    });

    fastify.get('/', {
        schema: {
          querystring: {
            type: 'object',
            properties: {
              page: { type: 'integer', default: null },
              limit: { type: 'integer', default: 10 },
              id: { type: 'integer' },
              ...publishedYearSchemaDefinition,
              author: { type: 'string' },
              isbn: { type: 'string' },
              title: { type: 'string' },
              order: { type: 'string', enum: ['asc', 'desc'], default: 'asc' }  // Nuovo parametro per l'ordinamento
            },
            required: []
          },
          response: {
            200: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'integer' },
                  title: { type: 'string' },
                  author: { type: 'string' },
                  isbn: { type: 'string' },
                  ...publishedYearSchemaDefinition
                },
                required: ['id', 'title', 'author']
              }
            }
          }
        },
        preHandler: [fastify.authenticate, fastify.authorize(['RO', 'RW'])]
      }, async (request, reply) => {
        const client = await fastify.pg.connect();
        
        try {
          const { page = null, limit = 10, id, published_year, author, isbn, title, order = 'asc' } = request.query;
          const offset = (page - 1) * limit;
      
          // Costruisci dinamicamente la query in base ai filtri opzionali
          let query = "SELECT id, title, author, isbn, published_year FROM books WHERE 1=1";  // 1=1 semplifica l'aggiunta di condizioni
          let values = [];
      
          if (id) {
            values.push(id);
            query += ` AND id = $${values.length}`;
          }
      
          if (published_year) {
            values.push(published_year);
            query += ` AND published_year = $${values.length}`;
          }
      
          if (author) {
            values.push(`%${author}%`);
            query += ` AND author ILIKE $${values.length}`;
          }
      
          if (isbn) {
            values.push(isbn);
            query += ` AND isbn = $${values.length}`;
          }
      
          if (title) {
            values.push(`%${title}%`);
            query += ` AND title ILIKE $${values.length}`;
          }
      
          // Aggiungi l'ordinamento per `publicationYear`
          query += ` ORDER BY published_year ${order}`;
      
          // Aggiungi la paginazione

          if (page) {
              query += ` LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
              values.push(limit, offset);
          }
      
          const { rows } = await client.query(query, values);
      
          reply.send(rows);
        } catch (error) {
            console.log(error)
          reply.code(500).send("Error connecting to the database");
        } finally {
          client.release();
        }
      });
            




    fastify.get('/:id', {
        preHandler: [fastify.authenticate, fastify.authorize(['RO', 'RW'])]
    }, async (request,reply) => {
        const client = await fastify.pg.connect()
        const {id} = request.params
        
        try {
            let query = "SELECT * FROM books";
            const values = [];
    
            // Se l'id è presente, filtra la query
            if (id) {
                query += " WHERE id = $1";
                values.push(id);
            }
    
            const { rows } = await client.query(query, values);
            
            if (rows.length === 0) {
                reply.code(404).send("Book not found");
            } else {
                reply.send(rows);
            }
        } catch (error) {
            reply.code(500).send("Error connecting to the database");
        } finally {
            client.release();
        }
    })

    fastify.post('/', {
        schema: {
            body: {
                type: 'object',
                required: ['title', 'author', 'isbn', 'published_year'],
                properties: {
                    title: { type: 'string', maxLength: 255 },
                    author: { type: 'string', maxLength: 255 },
                    isbn: { type: 'string', maxLength: 13 },
                    ...publishedYearSchemaDefinition
                }
            }
        },
        preHandler: [fastify.authenticate, fastify.authorize(['RW'])]
    }, async (request, reply) => {
        const client = await fastify.pg.connect();
        const { title, author, isbn, published_year } = request.body;
    
        try {
            const result = await client.query(
                'INSERT INTO books (title, author, isbn, published_year) VALUES ($1, $2, $3, $4)',
                [title, author, isbn, published_year]
            );
    
            reply.code(201).send({ message: 'Book inserted successfully' });
        } catch (error) {
            console.error(error);
            reply.code(500).send("Error inserting record into the database");
        } finally {
            client.release();
        }
    });
    

    fastify.put('/:id', {
        schema: {
            body: {
                type: 'object',
                properties: {
                    title: { type: 'string' },
                    author: { type: 'string' },
                    isbn: { type: 'string', maxLength: 13 },
                    ...publishedYearSchemaDefinition
                }
            }
        },
        preHandler: [fastify.authenticate, fastify.authorize(['RW'])]
    }, async (request, reply) => {
        const client = await fastify.pg.connect();
        const { title, author, isbn, published_year } = request.body;
        const {id} = request.params;
    
        try {
            let updateString = "";
            if (title) {
                updateString += `,title='${title}'`
            }
            if (author) {
                updateString += `,author='${author}'`
            }
            if (isbn) {
                updateString += `,isbn='${isbn}'`
            }
            if (published_year) {
                updateString += `,published_year=${published_year}` 
            }

            const result = await client.query(
                `UPDATE books SET id=${id} ${updateString} WHERE id='${id}'`
            );
    
            reply.code(201).send({ message: 'Book updated successfully' });
        } catch (error) {
            console.error(error);
            reply.code(500).send("Error updating record into the database");
        } finally {
            client.release();
        }
    });


    fastify.delete('/:id', {
        preHandler: [fastify.authenticate, fastify.authorize(['RW'])]
    }, async (request, reply) => {
        const client = await fastify.pg.connect();
        const { id } = request.params; // Recupera l'ID dai parametri URL
        try {
            const result = await client.query('DELETE FROM books WHERE id = $1', [id]);
            
            if (result.rowCount > 0) {
                reply.send({ message: `Book with ID ${id} deleted successfully` });
            } else {
                reply.code(404).send({ message: `Book with ID ${id} not found` });
            }
        } catch (error) {
            reply.code(500).send("Error deleting record from the database");
        } finally {
            client.release();
        }
    })
}

module.exports = bookRoutes