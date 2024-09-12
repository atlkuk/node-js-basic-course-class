const userSchema = {
    type: 'object',
    required: ['username', 'password'],
    properties: {
        username: { type: 'string' },
        password: { type: 'string' },
    },
};

const registerUserSchema = { ...userSchema };
registerUserSchema.properties = {
    ...userSchema.properties,
    role: { type: 'string', enum: ['admin', 'user'] },
    permissions: { type: 'string', enum: ['RO', 'RW'] }
}
registerUserSchema.required = ['username', 'password', 'role', 'permissions']

const apiGateway = async(fastify) => {
    // Rotta per il login
    fastify.post('/login', {
        schema: {
            body: userSchema
        }
    },
    async (request, reply) => {
        const { username, password } = request.body;
        
        const client = await fastify.pg.connect();
        try {
            const { rows } = await client.query(
            'SELECT * FROM users WHERE username = $1',
            [username]
            );
        
            if (rows.length === 0) {
                return reply.code(401).send({ message: 'Invalid credentials' });
            }
        
            const user = rows[0];

            const isPasswordValid = await fastify.bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return reply.code(400).send({ error: 'Invalid username or password' });
            }
        
            // Creazione del token JWT
            const token = fastify.jwt.sign({
                username: user.username,
                role: user.role,
                permissions: user.permissions
            });
        
            reply.send({ token });
        } catch (error) {
            reply.code(500).send({ error: 'Database error' });
        } finally {
            client.release();
        }
    });

    // Rotta per la registrazione degli utenti
    fastify.post('/register', {
        schema: {
            body: registerUserSchema
        }
    }, async (request, reply) => {
        const { username, password, role, permissions } = request.body;

        const client = await fastify.pg.connect();
        try {
            // Controlla se l'utente esiste già
            const { rows: existingUser } = await client.query(
                'SELECT * FROM users WHERE username = $1',
                [username]
            );
            if (existingUser.length > 0) {
                return reply.code(400).send({ message: 'User already exists' });
            }

            // Hash della password
            const hashedPassword = await fastify.bcrypt.hash(password);

            // Inserisce il nuovo utente nel database
            await client.query(
                'INSERT INTO users (username, password, role, permissions) VALUES ($1, $2, $3, $4)',
                [username, hashedPassword, role, permissions]
            );

            reply.send({ message: 'User registered successfully' });
        } catch (error) {
            reply.code(500).send({ error: 'Database error' });
        } finally {
            client.release();
        }
    });

    fastify.post('/verify', async (request, reply) => {
        const { token } = request.body
        console.log('*************', token)
        try {
            const decoded = await fastify.jwt.verify(token);
            return reply.send({ valid: true, decoded });
        } catch (err) {
            console.log(err)
            return reply.status(401).send({ valid: false, message: 'Invalid token' });
        }
    });
}


module.exports = apiGateway