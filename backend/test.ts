const c = require('bcrypt');
async function hash() {
    const password = '1234'
    const hash = await c.hash(password, 10);

    const match = await c.compare('', '$2b$10$4WRrYa2a/ycYdT5PGaMEMex8sJ.9qlxL3dPE8W5FdRpR7LhGVawGO');
    console.log(match);
}

hash()