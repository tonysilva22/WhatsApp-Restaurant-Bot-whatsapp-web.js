const qrcode = require('qrcode-terminal');
const { Client, MessageMedia } = require('whatsapp-web.js');
const fs = require('fs');


const client = new Client({ puppeteer: { executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' } });

client.on('qr', qr => {
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('Tudo certo! WhatsApp conectado.');
});

client.initialize();

let aguardandoFormaPagamento = false;
let aguardandoNome = false;
let aguardandoEndereco = false;
let nome = '';
let perguntouPedido = false;
let end = '';
let formaPagamento = '';
let aguardandoValorTroco = false;
let aguardandoObservacao = false;
let Observacao= '';
let aguardandoObservacaoTexto = false;
let valorTroco= '';
let aguardandoTroco= false;
let pedidoItens = [];
let totalPedidoCliente = 0;
let pedidosClientes = []; 
let detalhesPedido = [];


const menu = {
    '6': { name: '_X-Salada_', price: 18.0 },
    '7': { name: '_X-burger_', price: 20.0 },
    '8': { name: '_X-frango+bacon_', price: 25.0 },
    '9': { name: '_X-calabresa_', price: 28.0 },
    '10': { name: '_X-bacon_', price: 23.0 },
    '11': { name: '_X-fradinha_', price: 28.0 },
    '12': { name: '_X-tudo de frango_', price: 30.0 },
    

};

function salvarResumoPedido(resumo) {
  fs.appendFile('resumos.txt', resumo + '\n', (err) => {
    if (err) {
      console.error('Erro ao salvar o resumo do pedido:', err);
    } else {
      console.log('Resumo do pedido salvo com sucesso!');
    }
  });
}

function cumprimentar() {
  const dataAtual = new Date();
  const hora = dataAtual.getHours();

  let saudacao;

  if (hora >= 6 && hora < 12) {
    saudacao = "Bom dia!";
  } else if (hora >= 12 && hora < 17) {
    saudacao = "Boa tarde!";
  } else {
    saudacao = "Boa noite!";
  }

  return saudacao;
}

function getNomeCliente(numero) {
  try {
    const data = fs.readFileSync('contatos.txt', 'utf8');
    const linhas = data.split('\n');
    for (const linha of linhas) {
      const [num, nome] = linha.split(',');
      if (num === numero) {
        return nome;
      }
    }
  } catch (err) {
    return null;
  }
  return null;
}


function salvarNomeCliente(numero, nome) {
  const data = `${numero},${nome}\n`;
  fs.appendFileSync('contatos.txt', data, { flag: 'a+' });
  console.log(`salvo ${numero},${nome}\n`);
}


const delay = ms => new Promise(res => setTimeout(res, ms)); 


client.on('message', async (msg) => {
    const nomeCliente = getNomeCliente(msg.from)
    const lowerCaseMsg = msg.body.toLowerCase();

  if (msg.body === 'Boa tarde' || msg.body === 'boa tarde' || msg.body === 'BOA TARDE' ||
    msg.body === 'Boa tarde' || msg.body === 'Boa Noite' || msg.body === 'boa noite' || msg.body === 'BOA NOITE' ||
    msg.body === 'Oi' || msg.body === 'oi' || msg.body === 'OI' || msg.body === 'Olá' || msg.body === 'ola' ||
    msg.body === 'Ola' || msg.body === 'OLÁ' || msg.body === 'OLA' || msg.body === ''
  ) {
    

    if (nomeCliente && msg.from.endsWith('@c.us')) {
      const chat = await msg.getChat();; 
      await chat.sendStateTyping(); 
      await delay(10000); 
      await client.sendMessage(msg.from, `*${cumprimentar()} ${nomeCliente}!* 👋🏼\n\nBem-vindo ao nosso restaurante! Como posso ajudar você hoje? 🍔🍟🥤\n\n1️⃣ Ver o cardápio\n2️⃣ Conferir nossos horários de funcionamento\n`);

    } else {
      const chat = await msg.getChat();
      await chat.sendStateTyping(); 
      await delay(5000); 
      await client.sendMessage(msg.from, `${cumprimentar()} Seja bem-vindo(a) ao nosso restaurante! 😊\n\nAntes de prosseguirmos, por favor, poderia me informar o seu nome?`);
      aguardandoNome = true;
    }
  } else if (aguardandoNome && msg.from.endsWith('@c.us')) {
    nome = msg.body;
    aguardandoNome = false;
    salvarNomeCliente(msg.from, nome); 
    const chat = await msg.getChat(); 
    await chat.sendStateTyping(); 
    await delay(5000);
    await client.sendMessage(msg.from, `${nome}! 😄\n\nQue ótimo ter você aqui! Estou à disposição para ajudar. Como posso tornar sua experiência incrível hoje? 🍔🌟\n\n1️⃣ Ver o cardápio\n2️⃣ Conferir nossos horários de funcionamento\n`);

} 

else if ((msg.body === '1' || lowerCaseMsg === 'ver o cardápio'||lowerCaseMsg === 'cardápio') && msg.from.endsWith('@c.us')) {
  const chat = await msg.getChat();
  await chat.sendStateTyping(); 
  await delay(5000); 
  await client.sendMessage(msg.from, `Certo, ${nomeCliente}, vou enviar o nosso cardápio:`);
  const img2 = MessageMedia.fromFilePath('./card.jpg');
  await client.sendMessage(msg.from, img2, { caption: 'Escolha o número referente ao seu pedido:' });
  perguntouPedido = true;
} else if (perguntouPedido && msg.from.endsWith('@c.us')) {
  const options = msg.body.split(' ');
  let detalhesPedido = [];

  for (let i = 0; i < options.length; i++) {
    const option = options[i];

    if (!isNaN(option)) {
      const itemNumber = option;
      const item = menu[itemNumber];

      if (item) {
        const itemName = item.name;
        const itemPrice = item.price;
        pedidoItens.push(`${itemNumber} ${itemName}`);
        totalPedidoCliente += itemPrice;
        detalhesPedido.push({ itemNumber, itemName, itemPrice });
        await client.sendMessage(msg.from, `Pedido:\n${pedidoItens.join('\n')}\n\nTotal a pagar: R$${totalPedidoCliente.toFixed(2)}`);
      } else {
        const chat = await msg.getChat();
        await chat.sendStateTyping(); 
        await delay(5000); 
        await client.sendMessage(msg.from, `Opção inválida do menu: '${option}'. Por favor, escolha um número válido.`);
      }
      
      
    }
  }

  if (pedidoItens.length > 0) {
    const chat = await msg.getChat(); 
    await chat.sendStateTyping(); 
    await delay(5000); 
    await client.sendMessage(msg.from, `Você vai retirar o pedido ou precisa de entrega, ${nome}?\n8️⃣ *_Retirar no local_* \n9️⃣ *_Entrega_*`);
    perguntouPedido = false;
    aguardandoFormaPagamento = true;
  } else {
    await client.sendMessage(msg.from, 'Nenhum item válido foi selecionado.');
  }

}


else if ((msg.body === '8' || lowerCaseMsg === 'retirar no local') && msg.from.endsWith('@c.us')) {
  const chat = await msg.getChat();
  await chat.sendStateTyping(); 
  await delay(3000); 
  let resumo = `Resumo do Pedido de ${nomeCliente}:\n`;

  resumo += 'Pedido:\n' + pedidoItens.join('\n'); 

  if (detalhesPedido.length > 0) {
    resumo += '\n\nDetalhes do Pedido:\n';
    for (const detalhe of detalhesPedido) {
      resumo += `${detalhe.itemName}: R$${detalhe.itemPrice.toFixed(2)}\n`;
    }
  }

  const totalPedido = totalPedidoCliente;
  resumo += `\nTotal do Pedido: R$${totalPedido.toFixed(2)}\n`;

  resumo += `\nPerfeito, ${nomeCliente}! Seu pedido ficará pronto em até 30 minutos. Pode vir buscá-lo na nossa loja!\n`;

  await client.sendMessage(msg.from, resumo);
  const numerocl = '557588114675';
  await client.sendMessage(numerocl + '@c.us', resumo);
  console.log("resumo do pedido enviado para tony ")
  console.log(resumo)
  salvarResumoPedido(resumo);
  pedidoItens = [];
  totalPedidoCliente = 0;
  perguntouPedido = false;
  pedidosClientes = [];
}



else if ((msg.body === '9' || lowerCaseMsg === 'entrega') && msg.from.endsWith('@c.us')) {
  const chat = await msg.getChat();
  await chat.sendStateTyping(); 
  await delay(5000); 
await client.sendMessage(msg.from, `Por favor, ${nomeCliente}, informe o endereço completo para a entrega,\n*incluindo referências úteis para facilitar a localização.*`);
aguardandoEndereco = true;


} else if (aguardandoEndereco && msg.from.endsWith('@c.us')) {
end = msg.body;
const chat = await msg.getChat();
  await chat.sendStateTyping(); 
  await delay(7000); 
await client.sendMessage(msg.from, `Confirme o endereço de entrega do seu pedido:\n\n*${end}*`);
await client.sendMessage(msg.from, `O endereço está correto? Responda *Sim* para confirmar ou *Não* para corrigir.`);
aguardandoEndereco = false;
aguardandoFormaPagamento = true;


}else if (aguardandoFormaPagamento && msg.from.endsWith('@c.us')) {
if (msg.body.toLowerCase() === 'sim') {
  const chat = await msg.getChat();
  await chat.sendStateTyping(); 
  await delay(5000); 
  await client.sendMessage(msg.from, 'Ótimo! Agora, por favor, informe a forma de pagamento:\n*Pix*\n*Cartão*\n*Dinheiro*');
  aguardandoFormaPagamento = false;

} else if (msg.body.toLowerCase() === 'não') {
  await client.sendMessage(msg.from, `Por favor, informe o endereço completo para a entrega, ${nomeCliente}:`);
  aguardandoEndereco = true;
  aguardandoFormaPagamento = false;
  aguardandoObservacao = true;
} else {
  await client.sendMessage(msg.from, 'Desculpe, não entendi a sua resposta. Por favor, responda *Sim* para confirmar o endereço ou *Não* para corrigir.');
}

}

else if (msg.body.toLowerCase() === 'pix') {
  formaPagamento = 'Pix';
  const chat = await msg.getChat();
  await chat.sendStateTyping(); 
  await delay(5000); 
  await client.sendMessage(msg.from, `Excelente, ${nomeCliente}! Obrigado.\nNossa chave Pix para receber o pagamento é:\n *tonysilva2_2* 📧💳\n`); 
  await chat.sendStateTyping(); 
  await delay(5000); 
  await client.sendMessage( msg.from,`Se você tiver alguma Observação, digite 3️⃣.\n\nExemplo: '1 hambúrguer no ponto médio, com queijo cheddar e maionese extra!'\n\nOu, para prosseguir com o pedido, digite 0️⃣.`);
  aguardandoObservacao = true;

}

else if (msg.body.toLowerCase() === 'cartão') {
  formaPagamento = 'Cartão';
  await client.sendMessage(msg.from,`Se você tiver alguma Observação, digite 3️⃣.\n\n*Exemplo: '1 hambúrguer no ponto médio, com queijo cheddar e maionese extra!'*\n\nOu, para prosseguir com o pedido, digite 0️⃣.`);
  aguardandoObservacao = true;
}


else if (aguardandoObservacao && msg.body.toLowerCase() === '3') {
  const chat = await msg.getChat();
    await chat.sendStateTyping(); 
    await delay(5000); 
  await client.sendMessage(msg.from, `Qual é a sua Observação?`);
  aguardandoObservacaoTexto = true;

} else if (aguardandoObservacaoTexto) {
  Observacao = msg.body;
  aguardandoObservacaoTexto = false;
  const chat = await msg.getChat();
  await chat.sendStateTyping(); 
  await delay(6000); 
  await client.sendMessage(msg.from, `Está correto?\n\n *${Observacao}* \n\n Digite  0️⃣ para confirmar`);


} else if (msg.body.toLowerCase() === 'dinheiro') {
  formaPagamento = 'Dinheiro';
  const chat = await msg.getChat();
  await chat.sendStateTyping(); 
  await delay(6000); 
  await client.sendMessage(msg.from, `Certo, ${nomeCliente}! Você precisa de troco?\n\n*Sim preciso*\n*Não preciso*`);
  aguardandoTroco = true;



} else if (aguardandoTroco && msg.from.endsWith('@c.us')) {
  const lowerCaseMsg = msg.body.toLowerCase();
  if (lowerCaseMsg === 'não' || lowerCaseMsg === 'não preciso') {
    const chat = await msg.getChat();
    await chat.sendStateTyping(); 
    await delay(6000);
    await client.sendMessage(msg.from,`Se você tiver alguma Observação, digite 3️⃣.\n\nExemplo: '1 hambúrguer no ponto médio, com queijo cheddar e maionese extra!'\n\nOu, para prosseguir com o pedido, digite 0️⃣.`);
    aguardandoTroco = false;


  } else if (lowerCaseMsg === 'sim' || lowerCaseMsg === 'preciso') {
    const chat = await msg.getChat();
    await chat.sendStateTyping(); 
    await delay(6000); 
    await client.sendMessage(msg.from, `Perfeito, ${nomeCliente}! Agradecemos por informar.\nPor favor, digite o valor para o qual você precisa de troco.\n\n*Exemplo: Preciso de troco para R$ 100,00* 💵💰`);
    aguardandoValorTroco = true;
    aguardandoTroco = false;
  }
  
} else if (aguardandoValorTroco && msg.from.endsWith('@c.us')) {
     valorTroco = msg.body;
  if (!isNaN(valorTroco) && valorTroco > 0) {
    await client.sendMessage(  msg.from,`Se você tiver alguma Observação, digite 3️⃣.\n\nExemplo: '1 hambúrguer no ponto médio, com queijo cheddar e maionese extra!'\n\nOu, para prosseguir com o pedido, digite 0️⃣.`);
    aguardandoObservacao = true;
    aguardandoValorTroco = false;
  
  }


}

else if ((msg.body.toLowerCase() === 'finalizar' || msg.body === '0') && msg.from.endsWith('@c.us')) {
  const dataAtual = new Date();
  const dataFormatada = dataAtual.toLocaleDateString();
  const horaFormatada = dataAtual.toLocaleTimeString();

  let resumo = `*Resumo do Pedido de ${nomeCliente}:*\n`;
  resumo += `${dataFormatada} ${horaFormatada}\n\n`;

  if (end.trim() !== '') {
    resumo += `*Endereço de Entrega:* ${end}\n\n`;
  }

  resumo += `*Forma de Pagamento:* ${formaPagamento}\n\n`;

  if (Observacao.trim() !== '') {
    resumo += `*Observacao*: ${Observacao}\n\n`;
  }

  if(valorTroco.trim() !== ''){
    resumo += `*Troco Para*: ${valorTroco}\n\n`;
  }


  resumo += `*Pedido:*\n`;
  resumo += pedidoItens.join('\n');


  if (detalhesPedido.length > 0) {
    resumo += '\n\nDetalhes do Pedido:\n';
    for (const detalhe of detalhesPedido) {
      resumo += `${detalhe.itemName}: R$${detalhe.itemPrice.toFixed(2)}\n`;
    }
  }

  const totalPedido = totalPedidoCliente;
  resumo += `\n*Total do Pedido*: R$${totalPedido.toFixed(2)}\n`;
  let totalGeralPedido = totalPedido;
  resumo += `*Total Geral dos Pedidos*: *R$${totalGeralPedido.toFixed(2)}*\n\n`;
  resumo += `\n*Perfeito, ${nomeCliente}! Seu pedido será entregue em breve!*`;
  await client.sendMessage(msg.from, resumo);
 // const numerocl = 'Seu WhatsApp';
  //await client.sendMessage(numerocl + '@c.us', resumo);
  salvarResumoPedido(resumo);
  console.log(resumo)

  pedidoItens = [];
  totalPedidoCliente = 0;
  perguntouPedido = false;
  pedidosClientes = [];
}







});



