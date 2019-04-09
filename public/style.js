var x=document.querySelectorAll(".user-profile");
var y=document.querySelector("#user-show");
var flag=false;
y.addEventListener("click",function()
{
    if(!flag)
    {
      x[0].classList.remove("user-profile");
      x[0].classList.add("user-profile-hover");
      flag=true;
    }
    else
    {
        x[0].classList.remove("user-profile-hover");
        x[0].classList.add("user-profile");
        flag=false;
    }
});
