
// Instagram parallax

$(".parallax-instagram").parallax({

  imageSrc: "assets/img/instagram.jpg",

});
// Portada parallax
$(".parallax-portada").parallax({
  imageSrc: "assets/img/portada.jpg",
});

// ----------------------

// Portada

var divDressCode = document.querySelector(".scroll-down");
divDressCode.onclick = () => {
  var sectionCuenta = document.getElementById("cuenta-regresiva");
  sectionCuenta.scrollIntoView({ behavior: "smooth" });
};


// IMPORTANTE!!! Cuando usen FOTO de portada, la url se cambia por "assets/img/portada.jpg"
// IMPORTANTE!!! Cuando usen portada de catalogo, la url se cambia por "https://agendalafecha.com/invitaciones/recursos/img/montevideo/portada.jpg"

// ----------------------

// Cuenta Regresiva:

// Set the date we're counting down to
var countDownDate = new Date(2025, 10, 1, 21, 0, 0).getTime();

// Update the count down every 1 second
var x = setInterval(function () {
  // Get today's date and time
  var now = new Date().getTime();

  // Find the distance between now and the count down date
  var distance = countDownDate - now;

  // Time calculations for days, hours, minutes and seconds
  var days = Math.floor(distance / (1000 * 60 * 60 * 24));
  var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  var seconds = Math.floor((distance % (1000 * 60)) / 1000);

  // Display the result in the element with id="demo"
  // document.getElementById("reloj").innerHTML = days + " días: " + hours + "hs: " + minutes + "m: " + seconds + "s: ";
  document.getElementById("dias").innerHTML = agregarCero(days);
  document.getElementById("horas").innerHTML = agregarCero(hours);
  document.getElementById("min").innerHTML = agregarCero(minutes);
  document.getElementById("seg").innerHTML = agregarCero(seconds);
  // If the count down is finished, write some text
  if (distance < 0) {
    clearInterval(x);
    // document.getElementById("reloj").innerHTML = "¡Hoy es el gran día!";
    $("#reloj").removeClass("descartar");
    $("#reloj").prev("p").html("¡Es hoy!");
    $("#reloj_number").addClass("hidden");
  }
}, 1000);

function agregarCero(digito) {
  var digitoCadena = digito.toString();
  if (digitoCadena.length === 1) {
    digitoCadena = "0" + digitoCadena;
  }
  return digitoCadena;
}
// ----------------------

// musica

var audios = document.getElementById("audioPrueba");
var playAudio = () => {
  audios.play().catch((error) => {
    console.log("La reproducción automática no está permitida. Haz clic en la página para reproducir el audio.");
    return false;
  });
  $("#btnPlay").addClass("hidden");
  $("#btnPausa").removeClass("hidden");
  $("#btnPausa").addClass("pulse");
};
var pauseAudio = () => {
  audios.pause();
  $("#btnPausa").addClass("hidden");
  $("#btnPlay").removeClass("hidden");
  $("#btnPlay").addClass("vertical_shake");
};

// ----------------------

// Agendar en calendarios

var calendarioPrueba = () => {
  formatGoogleCalendarLink(fechaInicioEvento, fechaFinEvento);
  formatMicrosoftOfficeCalendarLink(fechaInicioEvento, fechaFinEvento);
  formatOutlookCalendarLink(fechaInicioEvento, fechaFinEvento);
  formatAppleCalendarLink(fechaInicioEvento, fechaFinEvento);
  formatYahooCalendarLink(fechaInicioEvento, fechaFinEvento);
};

function formatDateToISO8601(inputDate) {
  const date = new Date(inputDate);
  return date.toISOString().replace(/\.\d{3}Z$/, "Z");
}

function formatDateToICS(inputDate, zona) {
  const date = new Date(inputDate);
  zona ? date.setHours(date.getHours() - 3) : null;
  const formattedDate = date
    .toISOString()
    .replace(/[:-]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
  return formattedDate;
}

function formatGoogleCalendarLink(startDate, endDate) {
  const formattedStartDate = formatDateToICS(startDate);
  const formattedEndDate = formatDateToICS(endDate);
  const formattedTituloEvento = encodeURIComponent(tituloEvento);
  $("#LinkCalendarGoogle").attr("href", `https://calendar.google.com/calendar/render?action=TEMPLATE&dates=${formattedStartDate}%2F${formattedEndDate}&text=${formattedTituloEvento}&text=${formattedTituloEvento}`);
}

function formatOutlookCalendarLink(startDate, endDate) {
  const formattedStartDate = encodeURIComponent(formatDateToISO8601(startDate));
  const formattedEndDate = encodeURIComponent(formatDateToISO8601(endDate));
  const formattedTituloEvento = encodeURIComponent(tituloEvento);
  $("#LinkCalendarOutlook").attr("href", `https://outlook.live.com/calendar/0/action/compose?allday=false&enddt=${formattedEndDate}&path=%2Fcalendar%2Faction%2Fcompose&rru=addevent&startdt=${formattedStartDate}&subject=${formattedTituloEvento}`);
}

function formatMicrosoftOfficeCalendarLink(startDate, endDate) {
  const formattedStartDate = encodeURIComponent(formatDateToISO8601(startDate));
  const formattedEndDate = encodeURIComponent(formatDateToISO8601(endDate));
  const formattedTituloEvento = encodeURIComponent(tituloEvento);
  $("#LinkCalendarMicrosoft365").attr(
    "href",
    `https://outlook.office.com/calendar/action/compose?allday=false&enddt=${formattedEndDate}&path=%2Fcalendar%2Faction%2Fcompose&rru=addevent&startdt=${formattedStartDate}&subject=${formattedTituloEvento}`
  );
}

function formatAppleCalendarLink(startDate, endDate) {
  const formattedStartDate = formatDateToICS(startDate);
  const formattedEndDate = formatDateToICS(endDate);
  const formattedTituloEvento = encodeURIComponent(tituloEvento).replace(/%20/g, " ");
  $("#LinkCalendarApple").attr(
    "href",
    `data:text/calendar;charset=utf-8,${encodeURIComponent(`BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nURL:Evento\nDTSTART:${formattedStartDate}\nDTEND:${formattedEndDate}\nSUMMARY:${formattedTituloEvento}\nEND:VEVENT\nEND:VCALENDAR`)}`
  );
}

function formatYahooCalendarLink(startDate, endDate) {
  const formattedStartDate = formatDateToICS(startDate, true);
  const formattedEndDate = formatDateToICS(endDate, true);
  const formattedTituloEvento = encodeURIComponent(tituloEvento);
  $("#LinkCalendarYahoo").attr("href", `https://calendar.yahoo.com/?dur=&et=${formattedEndDate}&st=${formattedStartDate}&title=${formattedTituloEvento}&v=60`);
}
// ----------------------

// EJECUCIONES AUTOMATICAS

calendarioPrueba();

// ----------------------

// EFECTOS VISUALES POR CLASE.

document.addEventListener("DOMContentLoaded", function () {
  var fadeInClass = "fade-in";
  var fadeInUpClass = "fadeInUp";
  var iconInstagram = document.querySelector(".iconInstagram");
  var ceremonia = document.querySelector(".ceremonia");
  var regalo = document.querySelector(".regalo");
  var iconCalendario = document.querySelector(".iconCalendario");
  var iconMusic = document.querySelector(".iconMusic");
 var civil = document.querySelector(".civil");
  var fiesta = document.querySelector(".fiesta");
  var anillos = document.querySelector(".anillos");


  var divCanciones = document.querySelector(".divCanciones");
  var divAlojamientos = document.querySelector(".divAlojamientos");
  var divGracias = document.querySelector(".divGracias");
  var divCeremonia = document.querySelector(".divCeremonia");
   var divCivil = document.querySelector(".divCivil");
  var divTitleAgenda = document.querySelector(".divTitleAgenda");
  var divAgenda = document.querySelector(".divAgenda");
  var divFiesta = document.querySelector(".divFiesta");
  var divIntagram = document.querySelector(".divIntagram");
  var divDressCode = document.querySelector(".divDressCode");
  var divCbu = document.querySelector(".divCbu");
  var divAnillos = document.querySelector(".divAnillos");


  var titleGalery = document.querySelector(".title-galery");
  var imagenesGaleria = document.querySelectorAll("section.galeria .item-galeria");

  function isInViewport(element) {
    var rect = element.getBoundingClientRect();
    return rect.bottom >= 0 && rect.top <= (window.innerHeight || document.documentElement.clientHeight);
  }
  function agregarAnimacion(elemento, claseAnimacion, retraso) {
    setTimeout(function () {
      elemento.classList.add(claseAnimacion);
    }, retraso);
  }

  function aplicarAnimacionSiEnViewport(elemento, claseAnimacion, estilo) {
    if (isInViewport(elemento) && !elemento.classList.contains(claseAnimacion)) {
      elemento.classList.add(claseAnimacion);
      if (estilo) {
        elemento.style.opacity = "1";
      }
    }
  }

  document.addEventListener("scroll", function () {
      divCbu ? aplicarAnimacionSiEnViewport(divCbu, fadeInUpClass):null;    
      divDressCode ? aplicarAnimacionSiEnViewport(divDressCode, fadeInUpClass):null;    
      divCeremonia ? aplicarAnimacionSiEnViewport(divCeremonia, fadeInUpClass):null;    
      divTitleAgenda ? aplicarAnimacionSiEnViewport(divTitleAgenda, fadeInUpClass):null;    
      divAgenda ? aplicarAnimacionSiEnViewport(divAgenda, fadeInUpClass):null;    
      divIntagram ? aplicarAnimacionSiEnViewport(divIntagram, fadeInUpClass):null;    
      divCanciones ? aplicarAnimacionSiEnViewport(divCanciones, fadeInUpClass):null;    
      divGracias ? aplicarAnimacionSiEnViewport(divGracias, fadeInUpClass):null;    
      divFiesta ? aplicarAnimacionSiEnViewport(divFiesta, fadeInUpClass):null;
      divCivil ? aplicarAnimacionSiEnViewport(divCivil, fadeInUpClass):null;
      divAlojamientos ? aplicarAnimacionSiEnViewport(divAlojamientos, fadeInUpClass):null;
      divAnillos ? aplicarAnimacionSiEnViewport(divAnillos, fadeInUpClass):null;

    

      iconMusic ? aplicarAnimacionSiEnViewport(iconMusic, fadeInClass, true):null;    
      iconInstagram ? aplicarAnimacionSiEnViewport(iconInstagram, fadeInClass, true):null;    
      iconCalendario ? aplicarAnimacionSiEnViewport(iconCalendario, fadeInClass, true):null;    
      regalo ? aplicarAnimacionSiEnViewport(regalo, fadeInClass, true):null;    
      ceremonia ? aplicarAnimacionSiEnViewport(ceremonia, fadeInClass, true):null;
      fiesta ? aplicarAnimacionSiEnViewport(fiesta, fadeInClass, true):null;
      civil ? aplicarAnimacionSiEnViewport(civil, fadeInClass, true):null;
      titleGalery ? aplicarAnimacionSiEnViewport(titleGalery, fadeInClass, true):null;
      anillos ? aplicarAnimacionSiEnViewport(anillos, fadeInClass, true):null;
      
    imagenesGaleria.forEach(function (imagen, index) {
      var itemGaleria = imagen.closest(".item-galeria");
      if (isInViewport(itemGaleria) && !itemGaleria.classList.contains("fadeInUp")) {
        agregarAnimacion(itemGaleria, "fadeInUp", 200 * index);
        setTimeout(function () {
          itemGaleria.style.opacity = "1";
        }, 300 * index);
      }
    });
  });
});
