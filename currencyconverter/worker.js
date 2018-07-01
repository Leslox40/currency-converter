const cacheName = 'converter-cachev1';
const defaultContent = [
	'./',
	'./main.js',
	'./resources/style.css',
	'./resources/images/goldpic.png',
	'./resources/images/currencylogo.jpg',
	'https://fonts.googleapis.com/css?family=Lato',
]

//service worker installing

self.addEventListener('install', (e) => {
	e.waitUntil(
		caches.open(cacheName).then(function(cache){
			return cache.addAll(defaultContent);
		})
	);
});

//service worker activated

self.addEventListener('activate', (e) => {
	e.waitUntil(
		caches.keys().then((cacheNames) => {
			for(const thisCachName of cacheNames){
				if(thisCachName !== cacheName){
					caches.delete(thisCacheName);
          console.log(`${thisCacheName} deleted successfully`)
				}
			}
		})
	)

});

//fetch event
self.addEventListener('fetch', (e) => {
	const url = new URL(e.request.url)
	if(url.origin == location.origin){
		if(url.pathname === '/'){
			e.respondWith(caches.match('/'))
		}
		e.respondWith(
			loadData(e.request)
		)
	}
	else if(url.origin == 'https://free.currencyconverterapi.com'){
		fetch(e.request).then(response => {
			return response;
		})
	}
	else
		e.respondWith(loadData(e.request))
});

function loadData(data){
	return caches.open(cacheName).then(function(cache){
		return cache.match(data.clone()).then(function(response){
			const networkResponse = fetch(data).then(function(res){
				cache.put(data, res.clone());
				return res;
			})

			return response || networkResponse;

		})

	})

}
