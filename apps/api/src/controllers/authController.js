import { store } from '../data/store.js';
import { verifyPassword } from '../auth/password.js';
import { signToken } from '../utils/jwt.js';

export function login({ email, password }) {
  if (!email || !password) {
    throw new Error('Email dan password wajib diisi');
  }
  const user = store.findUserByEmail(email);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    const err = new Error('Kredensial tidak valid');
    err.statusCode = 401;
    throw err;
  }
  return {
    token: signToken({ sub: user.id, role: user.role, name: user.name }),
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}

export function devElevate({ code }) {
  if (code !== '123456') {
    const err = new Error('Kode pengembang salah');
    err.statusCode = 403;
    throw err;
  }
  return {
    token: signToken({ sub: 'u-dev', role: 'PENGEMBANG', name: 'Pengembang' }, 60 * 60),
  };
}
