const express = require('express');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const path = require('path');

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../public')));

app.use(session({
  secret: 'segredo-do-estudante',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 30 * 60 * 1000 } 
}));

const usuarios = [
  { usuario: 'admin', senha: '1234' },
  { usuario: 'aluno', senha: 'senha' }
];

const equipes = [];
const jogadores = [];

//verificação de login 
function verificarLogin(req, res, next) {
  if (req.session.usuario) {
    next();
  } else {
    res.status(401).json({ erro: 'Não autorizado' });
  }
}

//Login
app.post('/api/login', (req, res) => {
  const { usuario, senha } = req.body;
  const encontrado = usuarios.find(u => u.usuario === usuario && u.senha === senha);

  if (encontrado) {
    req.session.usuario = usuario;

    //cookie
    res.cookie('ultimoAcesso', new Date().toLocaleString('pt-BR'), {
      sameSite: 'lax'
    });

    return res.json({ ok: true });
  } else {
    return res.status(401).json({ erro: 'Usuário ou senha inválidos' });
  }
});

//Logout
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid'); 
    res.redirect('/login');
  });
});

//Rotas
app.get('/', (req, res) => {
  res.redirect('/login');
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/login.html'));
});

app.get('/menu', verificarLogin, (req, res) => {
  res.sendFile(path.join(__dirname, '../public/menu.html'));
});

app.get('/cadastro', verificarLogin, (req, res) => {
  res.sendFile(path.join(__dirname, '../public/cadastro.html'));
});

app.get('/cadastro2', verificarLogin, (req, res) => {
  res.sendFile(path.join(__dirname, '../public/cadastro2.html'));
});

// Cadastrar equipe
app.post('/api/equipes', verificarLogin, (req, res) => {
  const { nomeEquipe, tecnico, telefone } = req.body;

  if (!nomeEquipe || !tecnico || !telefone) {
    return res.status(400).json({ erro: 'Todos os campos são obrigatórios' });
  }

  equipes.push({ nomeEquipe, tecnico, telefone });
  return res.status(201).json({ mensagem: 'Equipe cadastrada com sucesso' });
});

//Retorna equipes
app.get('/api/equipes', verificarLogin, (req, res) => {
  return res.json(equipes);
});

//Cadastrar jogador
app.post('/api/jogadores', verificarLogin, (req, res) => {
  const { nome, numero, dataNascimento, altura, genero, posicao, equipe } = req.body;

  if (!nome || !numero || !dataNascimento || !altura || !genero || !posicao || !equipe) {
    return res.status(400).json({ erro: 'Todos os campos são obrigatórios' });
  }

  const jogadoresDaEquipe = jogadores.filter(j => j.equipe === equipe);
  if (jogadoresDaEquipe.length >= 6) {
    return res.status(400).json({ erro: 'Cada equipe pode ter no máximo 6 jogadores' });
  }

  jogadores.push({ nome, numero, dataNascimento, altura, genero, posicao, equipe });
  res.status(201).json({ mensagem: 'Jogador cadastrado com sucesso' });
});

//Jogadores agrupados
app.get('/api/jogadores', verificarLogin, (req, res) => {
  const agrupados = {};

  jogadores.forEach(jogador => {
    if (!agrupados[jogador.equipe]) {
      agrupados[jogador.equipe] = [];
    }
    agrupados[jogador.equipe].push(jogador);
  });

  res.json(agrupados);
});

// Informações do usuário
app.get('/api/usuario', verificarLogin, (req, res) => {
  return res.json({
    usuario: req.session.usuario,
    ultimoAcesso: req.cookies.ultimoAcesso || 'Não registrado'
  });
});

module.exports = app;