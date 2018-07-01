//global variables goes here
const from = document.getElementById('fromCurrency');
const to = document.getElementById('toCurrency');
const convertButton = document.getElementById('button');
const amount = document.getElementById('amount');
const print = document.getElementById('result');

//creating the indexDB and objectstore to store currencies and rates
const dbPromise = idb.open('currencies-list', 1, upgradeDb => {
  switch (upgradeDb.oldVersion) {
    case 0:
      let currencyStore = upgradeDb.createObjectStore('currency', {
         keyPath: 'id'
       });
    case 1:
      let rateStore = upgradeDb.createObjectStore('rates');
  }
});
//Registering service worker
  registerServiceWorker = () => {
    if('serviceWorker' in navigator) {
      navigator.serviceWorker.register('worker.js').then(function(){
      console.log('service worker registered');
      });
    }
  }
  registerServiceWorker();

//fetch currencies from api and serve them in database then
//serve them to the front end.
  fetchCurrencies = e => {
    fetch('https://free.currencyconverterapi.com/api/v5/currencies')
    .then(response => {
      //error handler
      if (response.status !== 200) {
        console.log(`There was a problem fetching ${response.status}`);
        return;
      }
      //handle actual response from the api in json
      response.json().then(data => {

        //looping through the json which has being change to an array of objects
        for (const key of Object.keys(data.results)) {
          //  console.log(data.results[key]);

            //saving the currencies in indexDB
            dbPromise.then(db => {
              if(!db) return;

              let tx = db.transaction('currency', 'readwrite');
              let currencyStore = tx.objectStore('currency');
               currencyStore.put(data.results[key], data.results[key].id);
               tx.complete;
            });

            //displaying the currencies to the front-end
            from.options[from.options.length] = new Option(`${data.results[key].id} (${data.results[key].currencyName})`, data.results[key].id);
            to.options[from.options.length] = new Option(`${data.results[key].id} (${data.results[key].currencyName})`, data.results[key].id);
        } //end of loop
      });
    })
    .catch(() => {
      console.log('yes')
      //getting currencies from indexDB when the network fails
      dbPromise.then(db => {
        if(!db) return;

        let tx = db.transaction('currency');
        let currencyStore = tx.objectStore('currency');
        currencyStore.getAll().then(currencies => {
          for (const currency of currencies) {
            console.log(currency.id);
            from.options[from.options.length] = new Option(`${currency.id} (${currency.currencyName})`, currency.id);
            to.options[from.options.length] = new Option(`${currency.id} (${currency.currencyName})`, currency.id);
          }
        });
      });
    });
  }
 fetchCurrencies();

 converter = () => {
   convertButton.addEventListener('click', ()=> {
     const fromCurrency = from.value;
     const toCurrency = to.value;
     const convertAmount = amount.value;
     const query = `${fromCurrency}_${toCurrency}`;
     const reversedQuery = `${toCurrency}_${toCurrency}`;
     console.log(`${fromCurrency} and ${toCurrency}`);

     fetch(`https://free.currencyconverterapi.com/api/v5/convert?q=${query}&compact=y`)
      .then(response => {
         return response.json();
      }).then(data => {
        //console.log(data)
        //console.log(data[`${query}`].val)
        const results = convertAmount * data[`${query}`].val;
        //console.log(results);
        print.innerHTML = `${convertAmount} ${fromCurrency} = ${results} ${toCurrency}`;

        dbPromise.then(db => {
          if(!db) return;

          const tx = db.transaction('rates', 'readwrite');
          const rateStore = tx.objectStore('rates');

          rateStore.put(data[`${query}`].val, query);
          rateStore.put((1 / data[`${query}`].val), reversedQuery);

        });
      }).catch()
   });
 }
 converter();
