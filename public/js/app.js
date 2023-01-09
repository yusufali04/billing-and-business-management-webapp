

var urls;

var screenWidth = document.body.clientWidth


if(screenWidth>1200){
urls = [
	'/img/slide/004.jpg',
	'/img/slide/001.jpg',
	'/img/slide/002.jpg',
	'/img/slide/003.jpg'
];
}
if(screenWidth<600){
urls = ['/img/mobile slides/slide1.jpg',
	'/img/mobile slides/slide2.jpg',
	'/img/mobile slides/slide3.jpg',
	'/img/mobile slides/slide4.jpg'
	]
}
if(screenWidth>601 && screenWidth<1100){
	urls = ['/img/tablet slides/slide1.jpg',
		'/img/tablet slides/slide2.jpg',
		'/img/tablet slides/slide3.jpg',
		'/img/tablet slides/slide4.jpg'
		]
}
if(screenWidth>1101 && screenWidth<1200){
	urls = ['/img/1024/slide1.jpg',
		'/img/1024/slide2.jpg',
		'/img/1024/slide3.jpg',
		'/img/1024/slide4.jpg'
		]
}
var placeholder = document.querySelector('.split-slider__placeholder')
var slides = document.querySelectorAll('.slide');
var slidesLength = slides.length;
var currentElem = slides[0];
var currentIndex = 0;

function loadImage(url) {
	return new Promise(function(resolve, reject) {
		var img = new Image();
		img.onload = function() {
			img.onload = img.onerror = null;
			resolve(img);
		};
		img.onerror = function(e) {
			img.onload = img.onerror = null;
			reject(e);
		};
		img.src = url;
	});
}

function loadImages(urls) {
	return Promise.all(urls.map(url => loadImage(url)))
}

function onError(error) {
	placeholder.classList.add('split-slider__placeholder_error');
	placeholder.innerHTML = `
		<pre><code>error</pre></code>`;
	return error;
}

function setImagesUrls(images) {
	slides.forEach((slide, index) => {
		slide.querySelector('.slide__image')
			.style.backgroundImage = `url(${images[index].src})`;
		slide.classList.remove('slide_wait');
	});
}

function setActiveSlide(index) {
	slides[index].classList.add('slide_active');
	currentElem.classList.remove('slide_active');
	currentElem = slides[index];
}

function changeSlide() {
	currentIndex = (currentIndex + 1 + slidesLength) % slidesLength;
	setActiveSlide(currentIndex);
}

function start() {
	setInterval(changeSlide, 4000);
}

loadImages(urls)
	.then(setImagesUrls)
	.then(start)
	.catch(onError)


	/*******getting current date */

const date = new Date();
var today = date.toISOString().slice(0,10);

document.getElementById("currentDate").value = today;




