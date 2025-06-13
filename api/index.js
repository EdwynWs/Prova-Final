const express = require('express');
const cookieParser = require('cookie-parser');
const { parse: parseCookie, serialize: serializeCookie } = require('cookie');
const path = require('path');
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../public')));

const usuarios = [
  { usuario: 'admin', senha: '1234' },
  { usuario: 'aluno', senha: 'senha' }
];
const equipes = [];


function verificarLogin(req, res, next) {
  const cookies = req.cookies;
  if (cookies.logado === 'true') {
    next();
  } else {
    res.status(401).json({ erro: 'Não autorizado' });
  }
}


app.post('/api/login', (req, res) => {
  const { usuario, senha } = req.body;
  const encontrado = usuarios.find(u => u.usuario === usuario && u.senha === senha);

  if (encontrado) {
    const expires = new Date(Date.now() + 2 * 3600 * 1000); // 2 horas

    res.cookie('logado', 'true', {
      httpOnly: true,
      sameSite: 'lax',
      expires
    });

   res.cookie('ultimoAcesso', new Date().toLocaleString('pt-BR'), {
  sameSite: 'lax'
});


    return res.json({ ok: true });
  } else {
    return res.status(401).json({ erro: 'Usuário ou senha inválidos' });
  }
});


app.get('/', (req, res) => {
  res.redirect('/login');
});
//login
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/login.html'));
});

//menu
app.get('/menu', verificarLogin, (req, res) => {
  res.sendFile(path.join(__dirname, '../public/menu.html'));
});

//cadastro de equipes
app.get('/cadastro', verificarLogin, (req, res) => {
  res.sendFile(path.join(__dirname, '../public/cadastro.html'));
});

//cadastro de jogadores
app.get('/cadastro2', verificarLogin, (req, res) => {
  res.sendFile(path.join(__dirname, '../public/cadastro2.html'));
});

//cadastrar equipes
app.post('/api/equipes', verificarLogin, (req, res) => {
  const novaEquipe = req.body;
  equipes.push(novaEquipe);
  return res.status(201).json({ mensagem: 'Equipe cadastrada com sucesso' });
});

//usuário logado
app.get('/api/usuario', verificarLogin, (req, res) => {
  return res.json({ usuario: 'Usuário logado' });
});
const jogadores = [];

app.post('/api/jogadores', verificarLogin, (req, res) => {
  const novo = req.body;
  jogadores.push(novo);
  res.status(201).json({ mensagem: 'Jogador cadastrado com sucesso' });
});

module.exports = app;