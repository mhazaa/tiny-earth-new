module.exports = function Timer(){
  this.seconds = 0;
  this.minutes = 0;
  this.hours = 0;
  this.day = 0;
  this.start = function(){
		var that = this;
		setInterval(function(){
			that.seconds++;
			if(that.seconds>=10){
				that.minutes++;
				that.seconds = 0;
			}
			if(that.minutes>=10){
				that.hours++;
				that.minutes = 0;
			}
			if(that.hours>=100){
				that.days++;
				that.hours = 0;
			}
		},1000);
	}
}
