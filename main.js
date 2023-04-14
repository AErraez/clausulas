const clausulas= require('./lista_clau.json')
const stringSimilarity = require('string-similarity');




function findSimilarSentences(objclaus, inputSentence) {
  let similarities = [];
  let sentencesArray=objclaus.map(claus=>claus["Cláusula"])
  for (let i = 0; i < sentencesArray.length; i++) {
    var sentence = sentencesArray[i];
    sentence=sentence.toLowerCase()
    const similarityScore = Number(stringSimilarity.compareTwoStrings(sentence, inputSentence)).toFixed(2);
    similarities.push({sentence, similarityScore});
  }
  similarities.sort((a, b) => b.similarityScore - a.similarityScore);
  return similarities.slice(0, 5).map(similarity => similarity.sentence +" "+ similarity.similarityScore);
}

let boton= document.getElementById("submit")

boton.addEventListener("click", (event)=>{
    let ramo= document.getElementById("ramo").value
    let texto= document.getElementById("texto").value

    let arrtxt= texto.split("\n")
    let txtclean= arrtxt.map((elem)=> {   //Se limpia el texto ingresado por el usuario
        elem= elem.replace("-"," ")
        elem= elem.trim()
        return elem
    })

    let clausramo= clausulas[ramo]
    console.log(txtclean[0])
    let section=document.getElementById("resultado")
    section.innerHTML=""
    txtclean.forEach(element => {
      let similist = findSimilarSentences(clausramo,element)
      let txttoshow= `<div class="col-5"><p>${element} ===> </p></div> 
                      <div class="col-2"><p>${similist[0]}</p></div> 
                      <div class="col-2"><p>${similist[1]}</p></div> 
                      <div class="col-2"><p>${similist[2]} </p></div>
                      <div class="col-1"><p>X</p></div>`
      section.innerHTML+=txttoshow
    });
})

