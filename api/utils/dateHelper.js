class DateHelper {
  getCurrentTimeStamp() {
    return Math.floor((new Date()).getTime() / 1000)
  }  
  getFormattedDate(date){
    let currentDate = new Date()
    if(date != undefined) {
      currentDate = date
    }
    let year = currentDate.getFullYear()
    let month = currentDate.getMonth() + 1
    if(month<10){
      month = '0'+month
    }
    let day = currentDate.getDate()
    if(day<10){
      day = '0'+day
    }
    return (`${year}-${month}-${day}`)
  }
  getTimezoneWiseDate(date, timezone){
    let date_time = new Date(date.toLocaleString("en-US", { timeZone: timezone }))
    console.log("$$$$$", date_time)
    return date_time
  }
}

module.exports = new DateHelper()
