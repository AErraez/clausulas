const clausulas = require("./lista_clau.json");
const stringSimilarity = require("string-similarity"); 

//**********************FUNCIONES********************//

function findSimilarSentences(objclaus, inputSentence) {
  let similarities = [];
  let sentencesArray = objclaus.map((claus) => claus["Cláusula"]);
  let codearray = objclaus.map((claus) => claus["Código"]);
  for (let i = 0; i < sentencesArray.length; i++) {
    var sentence = sentencesArray[i];
    var codclaus = codearray[i];
    sentence = sentence.toUpperCase();
    const similarityScore = Number(
      stringSimilarity.compareTwoStrings(sentence, inputSentence)
    ).toFixed(2);
    similarities.push({ sentence, similarityScore, codclaus });
  }
  similarities.sort((a, b) => b.similarityScore - a.similarityScore);
  return similarities
    .slice(0, 5)
    .map((similarity) => [
      similarity.sentence,
      similarity.codclaus,
      similarity.similarityScore,
    ]);
}

function arrtotext(arr) {
  let unique = [...new Set(arr)];
  let txt = "";
  unique.forEach((elem) => {
    txt += elem;
  });
  return txt.substring(0, txt.length - 1);
}


//**********************VARIABLES********************** */

let boton = document.getElementById("submit");

let reviewbutt = document.getElementById("revisar");

let reviewdiv = document.getElementById("check");

let activelist;

let clausramo;

let divselected= document.getElementById("selected")

let unselecteddiv = document.getElementById("unselected");
let footer = document.getElementById("clausulas");

let codtxt=""
let codarray= []

let htmlbutarr=[]
//**************EVENTOS************************************ */

boton.addEventListener("click", (event) => {
  manual_search_result.innerHTML = ""
  htmlbutarr=[]
  codtxt=""
  divselected.innerHTML=""
  unselecteddiv.innerHTML = "";
  review_active_list=[]
  activelist= []
  let ramo = document.getElementById("ramo").value;
  let texto = document.getElementById("texto").value;

  let arrtxt = texto.split("\n");
  let txtclean = arrtxt.map((elem) => {
    //Se limpia el texto ingresado por el usuario
    elem = elem.replace("-", " ");
    elem = elem.trim();
    elem = elem.toUpperCase();
    return elem;
  });

  clausramo = clausulas[ramo];
  
  let section = document.getElementById("resultado");
  section.innerHTML = "";
  codarray = [];
  txtclean.forEach((element) => {
    if (element!=""){
    let similist = findSimilarSentences(clausramo, element);
    console.log(similist[0][2])
    let txttoshow=""
    if (similist[0][2]>0.35){
      txttoshow = `<div class="row py-1 justify-content-around align-items-center text-align-center">
                      <div class="col-5"><p>${element} ===> </p></div> 
                      <div class="col-2 "><button class="claus-but active" value=${similist[0][1]}->${similist[0][0]} - ${similist[0][1]}</button></div> 
                      <div class="col-2 "><button class="claus-but" value=${similist[1][1]}->${similist[1][0]} - ${similist[1][1]}</button></div> 
                      <div class="col-2 "><button class="claus-but" value=${similist[2][1]}->${similist[2][0]} - ${similist[2][1]}</button></div> 
                      <div class="col-md-auto text-center"><button class="claus-but" name="${element}" value="">X</button></div> </div>`;
                      codarray.push(similist[0][1] + "-");
                    }
    else {
      txttoshow = `<div class="row py-1 justify-content-around align-items-center text-align-center">
      <div class="col-5"><p>${element} ===> </p></div> 
      <div class="col-2 "><button class="claus-but" value=${similist[0][1]}->${similist[0][0]} - ${similist[0][1]}</button></div> 
      <div class="col-2 "><button class="claus-but" value=${similist[1][1]}->${similist[1][0]} - ${similist[1][1]}</button></div> 
      <div class="col-2 "><button class="claus-but" value=${similist[2][1]}->${similist[2][0]} - ${similist[2][1]}</button></div> 
      <div class="col-md-auto text-center"><button class="claus-but active" name="${element}" value="">X</button></div> </div>`;

    }
    section.innerHTML += txttoshow;
    
    }
  });
  codtxt = arrtotext(codarray);
  footer.innerHTML = `<div class="row py-4 justify-content-around align-items-center text-align-center" id="selectable" onclick="selectText('selectable')"> ${codtxt}</div>`;
  activelist = document.querySelectorAll(".active")


  let listbut = document.querySelectorAll(".claus-but");
  let ibut = 0;
  let iarr = 0;
  let arrbut = [];
  let objbut = {};
  for (let but of listbut) {
    arrbut.push({ but });

    if (ibut > 0 && ibut % 4 == 3) {
      objbut[iarr.toString()] = arrbut;
      arrbut = [];
      iarr += 1;
    }
    ibut += 1;
  }
  

  for (let fila_boton in objbut) {
    let boton1 = objbut[fila_boton][0];
    let boton2 = objbut[fila_boton][1];
    let boton3 = objbut[fila_boton][2];
    let boton4 = objbut[fila_boton][3];
    for (let boton of objbut[fila_boton]) {
      boton.but.addEventListener("click", (event) => {
        boton1.but.classList.remove("active");
        boton2.but.classList.remove("active");
        boton3.but.classList.remove("active");
        boton4.but.classList.remove("active");
        boton.but.classList.add("active");
        activelist = document.querySelectorAll(".active"); //Se crea activelist aquí ya que esta cambia con cada click del botón
        codarray = [];
        for (let elem of activelist) {
          codarray.push(elem.value);
        }

        codtxt = arrtotext([...codarray, ...review_active_list]);
        
        footer.innerHTML = `<div class="row py-4 justify-content-around align-items-center text-align-center" id="selectable" onclick="selectText('selectable')"> ${codtxt}</div>`
     
        ;
      });
    }
  }
  reviewdiv.style.display = "block";
});

let manual_search_result = document.getElementById("manual_search_result");
let filterbutton = document.getElementById("searchclaus");
filterbutton.addEventListener("input", (event) => {
  manual_search_result.innerHTML = "";
  let filtertxt = filterbutton.value.toUpperCase();

  let filteredclaus = clausramo.filter((claus) =>
    claus["Cláusula"].includes(filtertxt)
  );
  filteredclaus = filteredclaus.slice(0, 10);
  
  filteredclaus.forEach((elem) => {
    manual_search_result.innerHTML += `<div class="py-2 col-12"><button class="review-but" value=${elem["Código"]}->${elem["Código"]} - ${elem["Cláusula"]}</button></div>`;
  });


  let review_button_list=document.querySelectorAll(".review-but")

  for (let button of review_button_list){
    button.addEventListener('click',(e)=>{
      if (!review_active_list.includes(button.value)){
        review_active_list.push(button.value)
        htmlbutarr.push(button.innerHTML)
        
      }    
      codtxt = arrtotext([...codarray, ...review_active_list]);
      
      footer.innerHTML = `<div class="row py-4 justify-content-around align-items-center text-align-center" id="selectable" onclick="selectText('selectable')"> ${codtxt}</div>`
      divselected.innerHTML=""
      review_active_list.forEach((elem,i)=>{
        divselected.innerHTML+=`<div class="py-2 col-12"><button class="rev-active" value=${elem}>${htmlbutarr[i]}</button></div>`
      })

      divselected.addEventListener('click', (event) => {
        if (event.target.classList.contains('rev-active')) {
          let value = event.target.value;
          let i = review_active_list.indexOf(value);
          if (i !== -1) {
            review_active_list.splice(i, 1);
            htmlbutarr.splice(i, 1);
      
            codtxt = arrtotext([...codarray, ...review_active_list]);
      
            footer.innerHTML = `<div class="row py-4 justify-content-around align-items-center text-align-center" id="selectable" onclick="selectText('selectable')"> ${codtxt}</div>`;
            divselected.innerHTML = "";
      
            review_active_list.forEach((elem, i) => {
              divselected.innerHTML += `<div class="py-2 col-12"><button class="rev-active" value=${elem}>${htmlbutarr[i]}</button></div>`;
            });
          }
        }
      });

    })
  }
});

let review_active_list=[]

reviewbutt.addEventListener("click", (event) => {
  let unselectedarr = [];
  unselecteddiv.innerHTML = "";
  for (let activebutton of activelist) {
    if (activebutton.value == "") {
      unselectedarr.push(activebutton.name);
    }
  }
  unselectedarr.forEach((unselected) => {
    unselecteddiv.innerHTML += `<div class="row py-2"><p>- ${unselected}</p></div>`;
  });


});


var clear_button= document.getElementById("clear-button")

clear_button.addEventListener("click",(e)=>{
  document.getElementById("texto").value=""
})


