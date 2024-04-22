


var format_but=document.getElementById('submit')
var result_div= document.getElementById('resultado')
var size_but=document.getElementById('tablesize')


function setup_arr(row_arr){
    let text_dist=size_but.value
    let df1={}
    for (let [i,val] of row_arr.entries()){
      df1[i]=val.split('\t')
    }
    let longest_val_arr1=[...df1[0]]
    for (let [i,long_word] of longest_val_arr1.entries()){
      longest_val_arr1[i]=long_word.trim()
    }
      
    for (let [i,val] of Object.entries(df1)){
      for (let [o, word] of val.entries()){
        word=word.trim()
        val[o]=word
        if (word.length>longest_val_arr1[o].length){
          longest_val_arr1[o]=word
        }
      }
    }
    return [df1, longest_val_arr1]
}

format_but.addEventListener('click', (e)=>{
    let text_dist=size_but.value
    let result_arr=[]
    let txt= document.getElementById('texto').value
    txt=txt.replaceAll("$","$ ")
    let row_arr=txt.split('\n')
    
    var [df, longest_val_arr]=setup_arr(row_arr)

  
    let intradistance= Math.floor((text_dist-longest_val_arr.reduce((acum, val)=>acum+val.length, 0))/(longest_val_arr.length-1))
    console.log(intradistance)
    let glob_limit=Math.floor(((text_dist)/longest_val_arr.length))
    
    let non_limit_obj ={"sum":0,"n_exceeding":0}
    longest_val_arr.forEach((current)=> current.length<=glob_limit ? non_limit_obj["sum"]+=glob_limit-current.length : non_limit_obj["n_exceeding"]+=1)
    
    let limit=glob_limit+Math.floor((non_limit_obj["sum"])/non_limit_obj["n_exceeding"])-Math.ceil((longest_val_arr.length-1)/non_limit_obj["n_exceeding"])
    console.log(glob_limit,non_limit_obj["n_exceeding"],"aaaaaaaaaa",limit)
    console.log(longest_val_arr)
  
    let entered_loop=0
    while (intradistance<=0){
      entered_loop=1
      intradistance= Math.floor((text_dist-longest_val_arr.reduce((acum, val)=>acum+val.length, 0))/(longest_val_arr.length-1))
      let append_count=0
      for (let [i,val] of Object.entries(df)){
        let new_row_arr=[]
        let word_added=false
        for (let [o, word] of val.entries()){
          if (word.length>limit){
            row_arr[Number(i)+append_count]=row_arr[Number(i)+append_count].replace(word,word.substring(limit,0))
            new_row_arr.push(word.substring(limit,word.length))
            word_added=true
          }
          else{
            new_row_arr.push(" ")
          }
        }
        if (word_added){
          row_arr.splice(Number(i)+1+append_count,0,new_row_arr.join("\t"))
          append_count+=1
        }
      }
      
      let result_arr=setup_arr(row_arr)
      
      df=result_arr[0]
      longest_val_arr=result_arr[1]
      
      console.log("intradistance: ",intradistance)
    }
    
    if (entered_loop){
      let longest_word=longest_val_arr.reduce(
        function (a, b) {
            return a.length > b.length ? a : b;
        }
      )
      while (longest_word.length>limit){
        intradistance= Math.floor((text_dist-longest_val_arr.reduce((acum, val)=>acum+val.length, 0))/(longest_val_arr.length-1))
        let append_count=0
        for (let [i,val] of Object.entries(df)){
          let new_row_arr=[]
          let word_added=false
          for (let [o, word] of val.entries()){
            if (word.length>limit){
              row_arr[Number(i)+append_count]=row_arr[Number(i)+append_count].replace(word,word.substring(limit,0))
              new_row_arr.push(word.substring(limit,word.length))
              word_added=true
            }
            else{
              new_row_arr.push(" ")
            }
          }
          if (word_added){
            row_arr.splice(Number(i)+1+append_count,0,new_row_arr.join("\t"))
            append_count+=1
          }
        }
        
        let result_arr=setup_arr(row_arr)
        
        df=result_arr[0]
        longest_val_arr=result_arr[1]
        
        console.log("intradistance: ",intradistance)
        longest_word=longest_val_arr.reduce(
          function (a, b) {
              return a.length > b.length ? a : b;
          }
        )
      }
    }
    intradistance= Math.floor((text_dist-longest_val_arr.reduce((acum, val)=>acum+val.length, 0))/(longest_val_arr.length-1))
    console.log(df)
    console.log(longest_val_arr)
    for (let [i,val] of Object.entries(df)){
      let row_to_text=''
      for (let [o, word] of val.entries()){
        if (o==(val.length-1)){  //last row doesn't need extra space
          row_to_text+=word
        }
        else {
        let extra_space=longest_val_arr[o].length-word.length
        row_to_text+=word+"&nbsp;".repeat(extra_space)+"&nbsp;".repeat(intradistance)
        }
      }
      result_arr.push(row_to_text)
    }
    
  
    result_div.innerHTML=`<div><button class="grey-but" style="width:10%"onclick=Copy('copyable')>Copiar</button></div><p id="copyable"style="white-space: pre; width: 97ch!important;" class="sise_font border border-dark">${result_arr.join("<br>")}</p>`
})

//to achieve a longer intradistance with long words the limit has to be reduced by x,
// where x=  Math.ceil(longest_val_arr.length-1/n_exceeding)
//  

var clear_button= document.getElementById("clear-button")

clear_button.addEventListener("click",(e)=>{
  document.getElementById("texto").value=""
})

