function check()
{
  var x=document.getElementById("password");
  var y=document.getElementById("retype-password");
  if(x.value!=y.value)
  {
    alert("Passwords do not match");
    return false;
  }
 return true;
} 
