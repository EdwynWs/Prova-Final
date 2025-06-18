const express = require('express');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
  secret: 'segredoSimples',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 30 * 60 * 1000 } // 30 minutos
}));
app.use(express.static(path.join(__dirname, '../public')));

const usuarios = [
  { usuario: 'admin', senha: '1234' },
  { usuario: 'aluno', senha: 'senha' }
];

const equipes = [];
const jogadores = [];


//login
function verificarLogin(req, res, next) {
  if (req.session.logado) {
    next();
  } else {
    res.status(401).send('Acesso não autorizado. Faça login.');
  }
}

app.get('/', (req, res) => {
  res.redirect('/login');
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/login.html'));
});

app.post('/api/login', (req, res) => {
  const { usuario, senha } = req.body;
  const encontrado = usuarios.find(u => u.usuario === usuario && u.senha === senha);

  if (encontrado) {
    req.session.logado = true;
    res.cookie('logado', 'true', { httpOnly: true });
    res.cookie('ultimoAcesso', new Date().toLocaleString('pt-BR'), { sameSite: 'lax' });
    res.redirect('/menu');
  } else {
    res.status(401).send('Usuário ou senha inválidos.');
  }
});

// Logout
app.get('/api/logout', (req, res) => {
  req.session.destroy();
  res.clearCookie('logado');
  res.redirect('/login');
});


// Menu
app.get('/menu', verificarLogin, (req, res) => {
  res.sendFile(path.join(__dirname, '../public/menu.html'));
});


// Cadastro de equipes
app.get('/cadastro', verificarLogin, (req, res) => {
  res.sendFile(path.join(__dirname, '../public/cadastro.html'));
});

app.post('/api/equipes', verificarLogin, (req, res) => {
  const { nome, tecnico, telefone } = req.body;

  if (!nome || !tecnico || !telefone) {
    return res.status(400).send('Todos os campos são obrigatórios!');
  }

  equipes.push({ nome, tecnico, telefone });
  res.redirect('/api/equipes');
});


// Listar equipes
app.get('/api/equipes', verificarLogin, (req, res) => {
  let html = '<h1>Equipes Cadastradas</h1><ul>';
  equipes.forEach(equipe => {
    html += `<li>Nome: ${equipe.nome}, Técnico: ${equipe.tecnico}, Telefone: ${equipe.telefone}</li>`;
  });
  html += '</ul><a href="/cadastro">Voltar para cadastro</a> | <a href="/menu">Menu</a>';
  res.send(html);
});


// Cadastro de jogadores
app.get('/cadastro2', verificarLogin, (req, res) => {
  let options = '';
  equipes.forEach(equipe => {
    options += `<option value="${equipe.nome}">${equipe.nome}</option>`;
  });

  const selectHtml = `
    <script>
      window.onload = function() {
        const select = document.getElementById('select-equipes');
        select.innerHTML = \`${options}\`;
      }
    </script>
  `;

  res.sendFile(path.join(__dirname, '../public/cadastro2.html'), {}, (err) => {
    if (!err) res.write(selectHtml);
  });
});


// Salvar jogador
app.post('/api/jogadores', verificarLogin, (req, res) => {
  const { nome, numero, nascimento, altura, genero, posicao, equipe } = req.body;

  if (!nome || !numero || !nascimento || !altura || !genero || !posicao || !equipe) {
    return res.status(400).send('Todos os campos são obrigatórios!');
  }

  jogadores.push({ nome, numero, nascimento, altura, genero, posicao, equipe });
  res.redirect('/api/jogadores');
});


// Listar jogadores por equipe
app.get('/api/jogadores', verificarLogin, (req, res) => {
  let html = '<h1>Jogadores por Equipe</h1>';

  equipes.forEach(equipe => {
    html += `<h2>${equipe.nome}</h2><ul>`;
    jogadores.filter(j => j.equipe === equipe.nome).forEach(jogador => {
      html += `<li>${jogador.nome} - Nº: ${jogador.numero} - Posição: ${jogador.posicao}</li>`;
    });
    html += '</ul>';
  });

  html += '<a href="/cadastro2">Voltar para cadastro</a> | <a href="/menu">Menu</a>';
  res.send(html);
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});

module.exports = app;