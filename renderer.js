// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

// Please pay attention how we use "remote" here. If you want run electron functions in the
// "renderer" process that are exclusive from the "main" process (mostly GUI-related),
// you can use "remote" to do it so easily.
const { dialog, BrowserWindow } = require('electron').remote
const Client = require('coinbase').Client;

const client = new Client({ 'apiKey': '<apiKey>', 'apiSecret': '<apiSecret>' });

const {
    getHowManyBtcCanIBuy,
    getTotalPriceOfBtcAmount,
    refreshRealData } = require('./utils');


// HTML elements
let currentBtcPriceElement = document.getElementById('current-btc-price');

let userBalanceFiatElement = document.getElementById('user-balance-fiat');
let userBalanceBtcElement = document.getElementById('user-balance-btc');

let inputAmountFiatElement = document.getElementById('input-amount-fiat');
let fiatCurrencyElement = document.getElementById('fiat-currency');

let inputAmountBtcElement = document.getElementById('input-amount-btc');

let buyBtnElement = document.getElementById('buy-btn');
let sellBtnElement = document.getElementById('sell-btn');
let estimatedAmountElement = document.getElementById('estimated-amount');

// Important: Change it to false when you want to use your real account from Coinbase
const useSandboxMode = true;
const fakeBTCPrice = 9000;
// Important: Depending on the currency you use in Coinbase, you need to select either 'EUR' or 'USD' (or any other valid one)
let fiatCurrency = 'EUR';

let currentBalanceFiat = useSandboxMode ? 5000 : 0;
let currentBalanceBtc = useSandboxMode ? 3 : 0;

// Events for buttons
buyBtnElement.addEventListener('click', function (event) {
    /*
    After clicking the "Buy" button we would like to buy BTCs. The amount is going to be defined
    by the number of Fiat that we specify in the input.
    */
    let successfulDialog = function () {
        let options = {
            type: 'info',
            title: 'Thanks!',
            message: 'You bought ' + btcAmount + ' BTCs'
        }
        dialog.showMessageBox(options)
    }
    let failureDialog = function (message) {
        let options = {
            type: 'error',
            title: 'Error',
            message: message
        }
        dialog.showMessageBox(options)
    }

    let money = parseFloat(inputAmountFiatElement.value);
    if (!money) {
        failureDialog('Invalid value!');
        return;
    }

    getHowManyBtcCanIBuy(client, fiatCurrency, money, useSandboxMode, fakeBTCPrice).then(function (btcAmount) {
        if (useSandboxMode) {
            if (money > currentBalanceFiat) {
                failureDialog('Sorry! You don\'t have enough money in your account!');
                return;
            }
            successfulDialog();
            // We update the "fake" balances
            currentBalanceFiat -= money;
            currentBalanceBtc += btcAmount;
            userBalanceFiatElement.innerHTML = 'Balance ' + fiatCurrency + ': ' + currentBalanceFiat + ' ' + fiatCurrency;
            userBalanceBtcElement.innerHTML = 'Balance BTC: ' + currentBalanceBtc + ' BTCs';
        } else {
            client.getAccounts({}, function (err, accounts) {
                accounts.forEach(function (acct) {
                    if (acct.type === 'fiat' && acct.currency === fiatCurrency) {
                        currentBalanceFiat = parseFloat(acct.balance.amount);

                        if (money > currentBalanceFiat) {
                            failureDialog('Sorry! You don\'t have enough money in your account!');
                            return;
                        }

                        let args = {
                            "amount": btcAmount.toString(),
                            "currency": "BTC",
                        };
                        acct.buy(args, function (err, txn) {
                            if (!err) {
                                successfulDialog();
                                // We update the "real" balances
                                refresh();
                            } else {
                                failureDialog(err.message);
                            }
                        });
                    }
                });
            });
        }
    })
})

sellBtnElement.addEventListener('click', function (event) {
    /*
    After clicking the "Sell" button we would like to sell BTCs.
    */

    let successfulDialog = function () {
        let options = {
            type: 'info',
            title: 'Thanks!',
            message: 'You sold ' + btcAmount + ' BTCs'
        }
        dialog.showMessageBox(options)
    }
    let failureDialog = function (message) {
        let options = {
            type: 'error',
            title: 'Error',
            message: message
        }
        dialog.showMessageBox(options)
    }

    let btcAmount = parseFloat(inputAmountBtcElement.value);
    if (!btcAmount) {
        failureDialog('Invalid value!');
        return;
    }

    getTotalPriceOfBtcAmount(client, fiatCurrency, btcAmount, useSandboxMode, fakeBTCPrice).then(function (price) {
        if (useSandboxMode) {
            if (btcAmount > currentBalanceBtc) {
                failureDialog('Sorry! You don\'t have enough BTCs in your account!');
                return;
            }
            successfulDialog();
            // We update the "fake" balances
            currentBalanceFiat += price;
            currentBalanceBtc -= btcAmount;
            userBalanceFiatElement.innerHTML = 'Balance ' + fiatCurrency + ': ' + currentBalanceFiat + ' ' + fiatCurrency;
            userBalanceBtcElement.innerHTML = 'Balance BTC: ' + currentBalanceBtc + ' BTCs';
        } else {
            client.getAccounts({}, function (err, accounts) {
                accounts.forEach(function (acct) {
                    if (acct.type === 'wallet' && acct.currency === 'BTC') {
                        currentBalanceBtc = parseFloat(acct.balance.amount);

                        if (btcAmount > currentBalanceBtc) {
                            failureDialog('Sorry! You don\'t have enough BTCs in your account!');
                            return;
                        }

                        let args = {
                            "amount": btcAmount.toString(),
                            "currency": "BTC",
                        };
                        acct.sell(args, function (err, txn) {
                            if (!err) {
                                successfulDialog();
                                // We update the "real" balances
                                refresh();
                            } else {
                                failureDialog(err.message);
                            }
                        });
                    }
                });
            });
        }
    })
})

// Events for inputs
inputAmountFiatElement.addEventListener('keyup', function (event) {
    /*
    While typing a certain fiat amount in the input, we would like to know how many BTCs that results
    */
    let money = parseFloat(event.target.value);
    if (!money) {
        estimatedAmountElement.innerHTML = '';
        return;
    }
    getHowManyBtcCanIBuy(client, fiatCurrency, money, useSandboxMode, fakeBTCPrice).then(function (price) {
        estimatedAmountElement.innerHTML = money + ' ' + fiatCurrency + ' = ' + price + ' BTCs';
    });
});

inputAmountBtcElement.addEventListener('keyup', function (event) {
    /*
    While typing a certain BTC amount in the input, we would like to know how much fiat that results
    */
    let btcAmount = parseFloat(event.target.value);
    if (!btcAmount) {
        estimatedAmountElement.innerHTML = '';
        return;
    }
    getTotalPriceOfBtcAmount(client, fiatCurrency, btcAmount, useSandboxMode, fakeBTCPrice).then(function (price) {
        estimatedAmountElement.innerHTML = btcAmount + ' BTCs = ' + price + ' ' + fiatCurrency;
    });
});

function refresh() {
    refreshRealData(
        client,
        fiatCurrency,
        userBalanceBtcElement,
        userBalanceFiatElement,
        currentBtcPriceElement,
        estimatedAmountElement,
        currentBalanceBtc,
        currentBalanceFiat
    )
}

// Init code

// Set Currency in the UI
fiatCurrencyElement.innerHTML = ' ' + fiatCurrency;

// Refresh data each 30 seconds
if (!useSandboxMode) {
    refresh();

    setInterval(function () {
        refresh();
    }, 30000);
}
