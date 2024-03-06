


var format_but=document.getElementById('submit')
var result_div= document.getElementById('resultado')

var text_dist=94

format_but.addEventListener('click', (e)=>{
    let result_arr=[]
    let txt= document.getElementById('texto').value
    let row_arr=txt.split('\n')
    let df={}
    for (let [i,val] of row_arr.entries()){
      df[i]=val.split('\t')
    }
    let longest_val_arr=[...df[0]]

    for (let [i,val] of Object.entries(df)){
      for (let [o, word] of val.entries()){
        word=word.trim()
        val[o]=word
        if (word.length>longest_val_arr[o].length){
          longest_val_arr[o]=word
        }
      }
    }
    console.log(df)
    console.log(longest_val_arr)
    let intradistance= Math.floor((94-longest_val_arr.reduce((acum, val)=>acum+val.length, 0))/(longest_val_arr.length-1))
    console.log(intradistance)

    for (let [i,val] of Object.entries(df)){
      let row_to_text=''
      for (let [o, word] of val.entries()){
        if (o==(val.length-1)){
          row_to_text+=word
        }
        else {
        let extra_space=longest_val_arr[o].length-word.length
        console.log(extra_space)
        row_to_text+=word+"&nbsp;".repeat(extra_space)+"&nbsp;".repeat(intradistance)
        }
      }
      result_arr.push(row_to_text)
    }
    console.log(result_arr.join("<br>"))
    result_div.innerHTML=`<p>${result_arr.join("<br>")}</p>`
})



var clear_button= document.getElementById("clear-button")

clear_button.addEventListener("click",(e)=>{
  document.getElementById("texto").value=""
})
