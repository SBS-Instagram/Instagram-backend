// app.js
import express, { query } from "express";
import mysql from "mysql2/promise";
import cors from "cors";
import axios from "axios";
import fileUpload from "express-fileupload";
import path from "path";
import fs from "fs";

const __dirname = path.resolve();

const app = express();

app.use(cors());
app.use(express.json());
app.use(fileUpload());
app.use(express.static("public"));

const port = 3002;
const pool = mysql.createPool({
  host: "localhost",
  user: "sbsst",
  password: "sbs123414",
  database: "a9",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// ===================== users ================
//전체조회
app.get("/users", async (req, res) => {
  const [users] = await pool.query(`SELECT * FROM users order by id desc`);
  res.json(users);
});
//이름순조회
app.get("/usersName", async (req, res) => {
  const [users] = await pool.query(`SELECT * FROM users order by name desc`);
  res.json(users);
});
//이름역순조회
app.get("/usersNameReverse", async (req, res) => {
  const [users] = await pool.query(`SELECT * FROM users order by name asc`);
  res.json(users);
});
//가입날짜순 조회
app.get("/usersRegdate", async (req, res) => {
  const [users] = await pool.query(`SELECT * FROM users order by regDate desc`);
  res.json(users);
});
//가입날짜역순 조회
app.get("/usersRegdateReverse", async (req, res) => {
  const [users] = await pool.query(`SELECT * FROM users order by regDate asc`);
  res.json(users);
});

//유저로그인
app.post("/login", async (req, res) => {
  const { user_id, password } = req.body;

  const [[user]] = await pool.query(
    `
  SELECT * 
  from \`user\` 
  where userid = ?
  `,
    [user_id]
  );

  if (!user) {
    res.status(401).json({
      authenticated: false,
      msg: "일치하는 회원이 없습니다.",
    });
    return;
  }
  if (user.password != password) {
    res.status(401).json({
      authenticated: false,
      msg: "비밀번호가 일치하지 않습니다.",
    });
    return;
  } else {
    res.status(200).json({
      authenticated: true,
      msg: "로그인 되었습니다.",
      user: user,
    });
  }
});

//단건조회
app.get("/users/:id", async (req, res) => {
  const { id } = req.params;
  const [userRow] = await pool.query(
    `
    SELECT * FROM users where id = ?
    `,
    [id]
  );

  if (userRow.length === 0) {
    res.status(404).json({
      msg: "not found",
    });
    return;
  }

  res.json([userRow]);
});
//전체수정
app.patch("/users/update/:id", async (req, res) => {
  const { id } = req.params;
  const { name, address, phone, feature } = req.body;

  const [userRow] = await pool.query(
    `
  select * from users where id = ?`,
    [id]
  );

  if (userRow.length === 0) {
    res.status(404).json({
      msg: "not found",
    });
    return;
  }

  if (!name || !address || !phone || !feature) {
    res.status(400).json({
      msg: "name, address, phone, feature required",
    });
  }
  const [rs] = await pool.query(
    `
  update users set
  name = ?,
  address = ?,
  phone = ?,
  regDate = now(),
  feature = ?
  where id = ?
  `,
    [name, address, phone, feature, id]
  );

  const [updateUsers] = await pool.query(
    `
    select * from users order by id desc
    `
  );
  res.json(updateUsers);
});
//유저 한명 삭제
app.delete("/users/delete/:id", async (req, res) => {
  const { id } = req.params;

  const [user] = await pool.query(
    `
  select * from users where id = ?`,
    [id]
  );

  if (user === 0) {
    res.status(404).json({
      msg: "not found",
    });
    return;
  }

  const [rs] = await pool.query(
    `
  delete from users where id = ?`,
    [id]
  );

  res.json({
    msg: `${id}번 유저가 삭제되었습니다.`,
  });
});
//유저 생성
app.post("/users/add", async (req, res) => {
  const { name, address, phone, feature } = req.body;

  if (!name || !address || !phone || !feature) {
    res.status(400).json({
      msg: "contents required",
    });
    return;
  }

  const [rs] = await pool.query(
    `
    INSERT INTO users SET regDate = NOW(),
    NAME = ?, 
    address = ?, 
    phone = ?, 
    feature = ?
    `,
    [name, address, phone, feature]
  );

  const [updatedUsers] = await pool.query(
    `select * from users order by id desc`
  );

  res.json(updatedUsers);
});
//유저 검색
app.get("/usersSearch/:name", async (req, res) => {
  const { name } = req.params;

  if (!name) {
    res.status(400).json({
      msg: "name required",
    });
    return;
  }

  const [users] = await pool.query(`SELECT * FROM users where name = ?`, [
    name,
  ]);

  if (users.length === 0) {
    res.status(404).json({
      msg: "not found",
    });
    return;
  }

  res.json(users);
});

// ========================= insta ====================
//insta 유저 가입
app.post("/joinMember", async (req, res) => {
  const { username, phone, userid, password } = req.body;

  if (username == null) {
    res.status(400).json({
      msg: "username required",
    });
    return;
  }
  if (phone == null) {
    res.status(400).json({
      msg: "phone required",
    });
    return;
  }
  if (userid == null) {
    res.status(400).json({
      msg: "userid required",
    });
    return;
  }
  if (password == null) {
    res.status(400).json({
      msg: "password required",
    });
    return;
  }

  await pool.query(
    `
  insert into insta set username = ?,
  phone = ?,
  userid = ?,
  password = ?`,
    [username, phone, userid, password]
  );

  res.json({
    msg: "가입이 완료되었습니다.",
  });
});
//insta 유저 조회
app.post("/getMember/:userid", async (req, res) => {
  const { userid } = req.params;
  const [[userRow]] = await pool.query(
    `
  select * from insta where userid = ?`,
    [userid]
  );

  if (!userid) {
    res.status(404).json({
      msg: "userid required",
    });
    return;
  }

  if (!userRow) {
    res.status(400).json({
      msg: "일치하는 회원이 없습니다.",
    });
    return;
  }

  res.json(userRow);
});
//insta 유저 로그인
app.post("/loginMember", async (req, res) => {
  const { userid, password } = req.body;

  const [[user]] = await pool.query(
    `
  SELECT * 
  from insta 
  where userid = ?
  `,
    [userid]
  );

  if (!user) {
    res.status(401).json({
      authenticated: false,
      msg: "일치하는 회원이 없습니다.",
    });
    return;
  }
  if (user.password != password) {
    res.status(401).json({
      authenticated: false,
      msg: "비밀번호가 일치하지 않습니다.",
    });
    return;
  } else {
    res.status(200).json({
      authenticated: true,
      msg: "로그인 되었습니다.",
      user: user,
    });
  }
});
//이미지 전체 조회
app.get("/getFiles", async (req, res) => {
  const [imgSrcs] = await pool.query(
    `
    SELECT * FROM img_table;
    `
  );
  res.json(imgSrcs);
});
//이미지 아이디 조회
app.post("/getFiles/:userid", async (req, res) => {
  const { userid } = req.params;
  const [imgSrcs] = await pool.query(
    `
    SELECT * FROM img_table where userid = ?;
    `,
    [userid]
  );
  res.json(imgSrcs);
});
//DB에 이미지 삽입
app.post("/upload/:userid", async (req, res) => {
  const { userid } = req.params;
  const { text } = req.body;
  let uploadFile = req.files.img;
  const fileName = req.files.img.name;
  const name = Date.now() + "." + fileName;

  uploadFile.mv(`${__dirname}/public/files/${name}`, async (err) => {
    if (err) {
      return res.status(500).send(err);
    }

    const imgSrc = `http://localhost:3002/files/${name}`;

    await pool.query(
      `
      insert into img_table set
      imgSrc = ?,
      userid = ?,
      body = ?,
      regDate = now()
      `,
      [imgSrc, userid, text]
    );

    await pool.query(
      `
    UPDATE insta SET article = article+1 WHERE userid = ?;
    `,
      [userid]
    );

    res.send(imgSrc);
  });
});
// 프로필사진 저장
app.post("/profileImage/:userid", async (req, res) => {
  const { userid } = req.params;
  let uploadFile = req.files.img;
  const fileName = req.files.img.name;
  const name = Date.now() + "." + fileName;
  uploadFile.mv(`${__dirname}/public/files/${name}`, async (err) => {
    if (err) {
      return res.status(500).send(err);
    }

    const imgSrc = `http://localhost:3002/files/${name}`;

    await pool.query(
      `
      UPDATE insta SET imgSrc = ?
      WHERE userid = ?
      `,
      [imgSrc, userid]
    );

    res.send(imgSrc);
  });
});
//인스타 유저정보 확인
app.get("/instaSearch/:searchValue", async (req, res) => {
  const { searchValue } = req.params;
  const [searched] = await pool.query(`
  select * from insta where userid like "%${searchValue}%" or username like "%${searchValue}%";
  `);

  if (!searchValue) {
    res.status(404).json({
      msg: "search Required",
    });
    return;
  }
  if (!searched.length) {
    res.status(400).json({
      msg: "검색 결과 없음.",
    });
    return;
  }

  res.json(searched);
});
// 인스타 follow
app.get("/instaFollow", async (req, res) => {
  const { reqId, resId } = req.query;

  if (!reqId) {
    res.status(404).json({
      msg: "request id required",
    });
    return;
  }

  if (!resId) {
    res.status(404).json({
      msg: "resend id required",
    });
    return;
  }

  const [isFollowed] = await pool.query(
    `
  SELECT * FROM follow_table WHERE
   followId = ? 
   AND followedId = ?
  `,
    [reqId, resId]
  );

  // 이미 팔로우를 했으면 팔로우취소 및 팔로우 팔로워 -1씩.
  // 그게 아니라면 팔로우신청 및 팔로우 팔로워 +1씩.

  if (isFollowed == "") {
    await pool.query(
      `
  update insta
  set followNum = followNum + 1
  where userid = ?
  `,
      [reqId]
    );

    await pool.query(
      `
  update insta
  set followerNum = followerNum + 1
  where userid = ?
  `,
      [resId]
    );

    await pool.query(
      `
  insert into follow_table set
  followId = ?,
  followedId = ?
 
  `,
      [reqId, resId]
    );

    res.json({ msg: "팔로우 성공" });
  } else {
    await pool.query(
      `
  update insta
  set followNum = followNum - 1
  where userid = ?
  `,
      [reqId]
    );

    await pool.query(
      `
  update insta
  set followerNum = followerNum - 1
  where userid = ?
  `,
      [resId]
    );

    await pool.query(
      `
      DELETE FROM follow_table
       WHERE followId = ? AND 
       followedId = ?
  
  `,
      [reqId, resId]
    );

    res.json({ msg: "팔로우 취소" });
  }
});
//인스타 follow 체크
app.get("/isFollowed", async (req, res) => {
  const { reqId, resId } = req.query;

  if (!reqId) {
    res.status(404).json({
      msg: "request id required",
    });
    return;
  }

  if (!resId) {
    res.status(404).json({
      msg: "resend id required",
    });
    return;
  }

  const [[isFollowed]] = await pool.query(
    `
  SELECT * FROM follow_table WHERE
   followId = ? 
   AND followedId = ?
  `,
    [reqId, resId]
  );

  if (isFollowed != undefined) {
    res.json(true);
  } else {
    res.json(false);
  }
});
// 인스타 삭제
app.delete("/delete", async (req, res) => {
  const { id, userid } = req.query;

  const [userRow] = await pool.query(
    `
    select *
    from img_table
    where id = ?
    `,
    [id]
  );

  if (userRow == undefined) {
    res.status(404).json({
      msg: "not found",
    });
    return;
  }

  await pool.query(
    `
    delete 
    from img_table
    where id = ?
    `,
    [id]
  );

  await pool.query(
    `
    update insta
    set article = article - 1
    where userid = ?
    `,
    [userid]
  );
  const [updatedUsers] = await pool.query(
    `
    select *
    from img_table
    order by id asc
    `,
    [id]
  );

  res.json(updatedUsers);
});
// 인스타 좋아요
app.post("/like", async (req, res) => {
  const { id, userid, imgSrc } = req.query;

  const [isLiked] = await pool.query(
    `
  SELECT * FROM like_table WHERE
   id = ? 
   AND likeid = ?
  `,
    [id, userid]
  );

  if (isLiked == "") {
    await pool.query(
      `
      insert into like_table set
      id = ?,
      likeid = ?,
      imgSrc = ?,
      liked = 1
      `,
      [id, userid, imgSrc]
    );

    await pool.query(
      `
      update img_table set
      imgLike = imgLike + 1
      where id = ?
      `,
      [id]
    );

    res.json({
      msg: "좋아요 성공",
    });
  } else {
    await pool.query(
      `
      update img_table set
      imgLike = imgLike - 1
      where id = ?
      `,
      [id]
    );

    await pool.query(
      `
      DELETE FROM like_table
       WHERE id = ? AND 
       likeid = ?
      `,
      [id, userid]
    );

    res.json({
      msg: "좋아요 취소",
    });
  }
});
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
