var x=document.querySelector("#nav-small-anchor");
var y=document.querySelectorAll(".user-activities");
var flag=false;
x.addEventListener("click",function()
{
     if(!flag)
     {
         y[0].classList.remove("user-activities");
         y[0].classList.add("user-activities-hover");
         flag=true;
     }
     else
     {
        y[0].classList.remove("user-activities-hover");
        y[0].classList.add("user-activities");
        flag=false;
     }
});