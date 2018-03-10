
// Utils functions
function getHowManyBtcCanIBuy(client, fiatCurrency, money, useSandboxMode, fakeBTCPrice) {
    /*
    Get number of BTCs that you would get based on that fiat amount
    */
    if (useSandboxMode) {
        return new Promise((resolve, reject) => {
            resolve(money / fakeBTCPrice);
        });
    } else {
        let currencyPair = 'BTC-' + fiatCurrency;
        return new Promise((resolve, reject) => {
            return client.getBuyPrice({ 'currencyPair': currencyPair }, function (err, obj) {
                if (!err) {
                    btcPrice = parseFloat(obj.data.amount);

                    resolve(money / btcPrice);
                }
            });
        });

    }
}

function getTotalPriceOfBtcAmount(client, fiatCurrency, btcAmount, useSandboxMode, fakeBTCPrice) {
    /*
    Get number of Fiat that you would get based on that BTC amount
    */
    if (useSandboxMode) {
        return new Promise((resolve, reject) => {
            resolve(btcAmount * fakeBTCPrice);
        });
    } else {
        let currencyPair = 'BTC-' + fiatCurrency;
        return new Promise((resolve, reject) => {
            return client.getBuyPrice({ 'currencyPair': currencyPair}, function (err, obj) {
                if (!err) {
                    btcPrice = parseFloat(obj.data.amount);

                    resolve(btcAmount * btcPrice);
                }
            });
        });
    }
}


function refreshRealData(
    /*
    Refresh the User balance as It could have been changed in the exchange
    */
    client,
    fiatCurrency,
    userBalanceBtcElement,
    userBalanceFiatElement,
    currentBtcPriceElement,
    estimatedAmountElement,
    currentBalanceBtc,
    currentBalanceFiat
) {

    return new Promise((resolve, reject) => {
        return client.getAccounts({}, function (err, accounts) {
            accounts.forEach(function (acct) {
                if (acct.type === 'fiat' && acct.currency === fiatCurrency) {
                    // This code will update your Fiat balance using the real data from Coinbase
                    currentBalanceFiat = parseFloat(acct.balance.amount);
                    userBalanceFiatElement.innerHTML = 'Balance Fiat: ' + currentBalanceFiat + ' ' + fiatCurrency;

                    // This code will update the displayed BTC price using real data from Coinbase
                    getTotalPriceOfBtcAmount(client, fiatCurrency, 1, false, null).then(function(price) {
                        currentBtcPriceElement.innerHTML = '(Price: ' + price + ' ' + fiatCurrency + ')';
                    })
                    estimatedAmountElement.innerHTML = '';
                } else if (acct.type === 'wallet' && acct.currency === 'BTC') {
                    // This code will update your BTC balance using the real data from Coinbase
                    currentBalanceBtc = parseFloat(acct.balance.amount);
                    userBalanceBtcElement.innerHTML = 'Balance BTC: ' + currentBalanceBtc + ' ' + acct.balance.currency;
                }
                resolve();
            });
        });        
    });
}


module.exports = {
    getHowManyBtcCanIBuy,
    getTotalPriceOfBtcAmount,
    refreshRealData
}