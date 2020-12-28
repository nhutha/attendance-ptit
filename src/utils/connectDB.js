import sql from "mssql";

class ConnectDB {
  connect = null;
  constructor() {
    this.connect = null;
  }

  createConnect = async () => {
    this.connect = await sql.connect("Data Source=attendance.c9cpmvqpxmpq.us-east-2.rds.amazonaws.com;Initial Catalog=AttendanceManager;User ID=admin;Password=12345678")
    if (this.connect) {
      console.log("CONNECT DATABASE SUCCESS");
    }
  }
}

const connectDB = new ConnectDB();


export default connectDB;
