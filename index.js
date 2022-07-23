// Модули для запросов к серверу GameCoin!
const axios = require('axios');
const https = require('https');
const httsAgent = new https.Agent({ rejectUnauthorized: false });

// Модуль для сохранение Json - файла.
const fs = require('fs');

// Модуль для работы бота.
const { VK } = require('vk-io');

// Эта функция обязятельна (если пишет что проблема с SSL).
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0

// Json - файл, в который сохраняется история переводов,
// Через который и определяется новый платёж!
const history = require('./history.json');

// ID - юзера, для проверки запросов!
var uid = 198700932

// Token - токен который вы получите в приложении
var token = ''

// Проверка баланса (любого пользователя, можно и своего.)
async function getBalance() {
	let { data } = await axios.post('https://dan-app.space:9090/api/user.getBalance', {
		"uid": uid,
	})
	return data.balance;
}

// История переводов
async function payHistory() {
	let { data } = await axios.post('https://dan-app.space:9090/api/merchant.getTransfer', {
		"token": token,
		"count": 5 // по умолчанию - 5, но можете поставить 20 к примеру.
    })
    return data;
}

// Пополнение мерчанта
setInterval(async() => {
	let historyPayment = await payHistory();
	for(i in historyPayment) {
	if(!history[historyPayment[i].key]) {
		history[historyPayment[i].key] = {
			userID: Number(historyPayment[i].from_id),
			trSum: Number(historyPayment[i].sum)
		}
	console.log(historyPayment[i]);
	
	// Уведомление для того кто пополнил баланс.
	vk.api.messages.send({
		peer_id: historyPayment[i].from_id,
		message: `✅ Ваш счёт пополнен на ${historyPayment[i].sum} GC!`
	})
	
	// Уведомление для администрации.
	vk.api.messages.send({
		peer_id: 0,
		message: `🆕 Поступил новый платёж!\n💬 @id${historyPayment[i].from_id} пополнил ${historyPayment[i].sum} GC!\n💯 Номер платежа: ${historyPayment[i].key}`
	})
	
	}
	}
}, 1000);

// Вывод Game Coin'ов
async function sendCoin() {
  let { data } = await axios.post('https://dan-app.space:9090/api/merchant.send', {
  "token": token,
  "to": uid,
  "sum": 100 // это сумма перевода.
  })
  console.log(data)
  return data;
}


// Редактор мерчанта: смена именни, фото, описание и ID - группы!
async function editMerchant() {
	let { data } = await axios.post('https://dan-app.space:9090/api/merchant.edit', {
		"token": token,
		"name": 'Тестовое название мерчанта',
		"photo": 'https://sun6-23.userapi.com/s/v1/ig2/iUQf1PhVSlqdnYYueAK6crGxl5HxPnptg8_qcLC289X5ViydK__gDBSDHHbf7Y72nVuIogl_dYKeSqxoyBpOBh2P.jpg?size=200x200&quality=95&crop=0,0,500,500&ava=1',
		"description": 'Тестовый текст',
		"group_id": 1
    })
	console.log(data)
    return data;
}

var vk = new VK({
	token: '' // токен группы
});

vk.updates.on('new_message', async(ctx) => {
	console.log(ctx)
	if(ctx.text == 'Бал') {
		let balance = await getBalance();
		return ctx.send(`Ваш баланс: ${balance}`);
	}
	if(ctx.text == 'Вывод') {
		sendCoin();
		return ctx.send(`✅ Выполнен вывод в размере: 100 GameCoin!`);
	}
	
});

// сохранение Json - файла.
setInterval(() => {
    fs.writeFileSync("./history.json", JSON.stringify(history, null, "\t"))
}, 1000);

vk.updates.start(console.log(`Bot API, GameCoin Activated!`));
