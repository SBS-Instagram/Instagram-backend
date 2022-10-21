// app.js
import express, { query } from "express";
import mysql from "mysql2/promise";
import cors from "cors";
import axios from "axios";
import fileUpload from "express-fileupload";
import path from "path";
import fs from "fs";
import e from "express";

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

    const [[imgs]] = await pool.query(
      `
      select id from img_table order by id desc;
      `
    );

    await pool.query(
      `
    insert into like_table set
    articleid = ?,
    liked = 0
    `,
      [imgs.id]
    );

    res.send(imgSrc);
  });
});
//인스타 게시글 사진수정
app.post("/updatePhoto/:userid", async (req, res) => {
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
      update img_table set
      imgSrc = ?,
      body = ?
      where userid = ?
      `,
      [imgSrc, text, userid]
    );
    res.send(imgSrc);
  });
});
//인스타 게시글만 수정
app.post("/updateText/:userid", async (req, res) => {
  const { userid } = req.params;
  const { body } = req.body;

  await pool.query(
    `
    update img_table set
    body = ?
    where userid = ?
    `,
    [body, userid]
  );
  res.json({ msg: "수정 완료" });
});
//DB 이미지 조회
app.get("/getImage/:id", async (req, res) => {
  const { id } = req.params;

  const [[image]] = await pool.query(
    `
    select * from img_table 
    where id = ?
    `,
    [id]
  );

  res.json(image);
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
      UPDATE insta SET userimgSrc = ?
      WHERE userid = ?
      `,
      [imgSrc, userid]
    );

    await pool.query(
      `
      update reply_table set replyuserImgSrc = ?
      where replyid = ?
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

  if (searched == "") {
    res.json(false);
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
    const [[followed]] = await pool.query(
      `
      select * from follow_table
      where followId = ? and
      followedId = ?
      `,
      [reqId, resId]
    );
    if (followed != undefined) {
      res.json(true);
    }
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
    const [[followed]] = await pool.query(
      `
      select * from follow_table
      where followId = ? and
      followedId = ?
      `,
      [reqId, resId]
    );
    if (followed == undefined) {
      res.json(false);
    }
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

  if (isFollowed === undefined) {
    res.json(false);
  } else {
    res.json(true);
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
    delete from reply_table
    where articleid = ?
    `,
    [id]
  );

  await pool.query(
    `
  delete from like_table
  where articleid = ?
  `,
    [id]
  );
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
  const { id, userid, userimgSrc } = req.query;

  const [isLiked] = await pool.query(
    `
  SELECT * FROM like_table WHERE
   articleid = ? 
   AND likeid = ?
  `,
    [id, userid]
  );

  if (isLiked == "") {
    await pool.query(
      `
      update like_table set
      likeid = ?,
      likeuserimgSrc = ?,
      liked = 1
      where articleid = ?
      `,
      [userid, userimgSrc, id]
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
      update like_table set
      likeid = "",
      likeuserimgSrc="",
      liked = 0
       WHERE articleid = ? AND 
       likeid = ?
      `,
      [id, userid]
    );

    res.json({
      msg: "좋아요 취소",
    });
  }
});
//인스타 좋아요 체크
app.get("/isLiked", async (req, res) => {
  const { userid, id } = req.query;

  if (!userid) {
    res.status(404).json({
      msg: "로그인이 필요한 기능입니다.",
    });
    return;
  }

  if (!id) {
    res.status(404).json({
      msg: "article id required",
    });
    return;
  }

  const [[isLiked]] = await pool.query(
    `
  SELECT * FROM like_table WHERE
   likeid = ? 
   AND articleid = ?
  `,
    [userid, id]
  );

  if (isLiked != undefined) {
    res.json(true);
  } else {
    res.json(false);
  }
});
//인스타 사진정보로 유저확인
app.get("/getUser/:id", async (req, res) => {
  const { id } = req.params;

  if (!id) {
    res.status(404).json({
      msg: "id Required",
    });
    return;
  }

  const [[userid]] = await pool.query(
    `
    SELECT userid from img_table where id = ?
    `,
    [id]
  );

  if (!userid) {
    res.status(400).json({
      msg: "유저가 없습니다.",
    });
  }
  const [[user]] = await pool.query(
    `
    select * from insta where userid = ?
    `,
    [userid.userid]
  );

  if (!user) {
    res.status(400).json({
      msg: "유저가 없습니다.",
    });
    return;
  }

  res.json(user);
});
//인스타 댓글추가
app.post("/instaReply", async (req, res) => {
  const { id, userid } = req.query;
  const { reply } = req.body;

  if (!id || !userid || !reply) {
    res.status(404).json({
      msg: "잘못된 접근입니다.",
    });
    return;
  }

  const [[user]] = await pool.query(
    `
    select * from insta where userid = ?
    `,
    [userid]
  );

  await pool.query(
    `
    insert into reply_table set
    articleid = ?,
    replyid = ?,
    reply = ?,
    
    replyusername = ?,
    replyuserImgSrc = ?
    `,
    [id, userid, reply, user.username, user.userimgSrc]
  );

  await pool.query(
    `
    update img_table set imgReply = imgReply + 1 where id = ?
    `,
    [id]
  );

  const [replies] = await pool.query(
    `
    select * from reply_table where articleid = ?
    `,
    [id]
  );
  res.json(replies);
});
//인스타 댓글 불러오기
app.get("/getReplies/:id", async (req, res) => {
  const { id } = req.params;

  const [replies] = await pool.query(
    `
    select * from reply_table where articleid = ?
    `,
    [id]
  );

  if (replies.length == 0) {
    res.json(false);
  } else {
    res.json(replies);
  }
});
//인스타 화살표 누르면 다음게시글
app.get("/nextImage", async (req, res) => {
  const { id, userid } = req.query;
  if (!id) {
    req.status(404).json({
      msg: " id Required",
    });
    return;
  }

  const [images] = await pool.query(
    `
    select * from img_table where userid = ?
    `,
    [userid]
  );

  const [[currentImage]] = await pool.query(
    `
    select * from img_table where userid = ? and id = ?
    `,
    [userid, id]
  );

  const [nextImage] = images.reverse().filter((image) => {
    return currentImage.id > image.id ? true : false;
  });
  if (nextImage != undefined) {
    res.json(nextImage);
  } else {
    res.json(false);
  }
});
//인스타 화살표 누르면 이전게시글
app.get("/prevImage", async (req, res) => {
  const { id, userid } = req.query;
  if (!id) {
    req.status(404).json({
      msg: " id Required",
    });
    return;
  }

  const [images] = await pool.query(
    `
    select * from img_table where userid = ?
    `,
    [userid]
  );

  const [[currentImage]] = await pool.query(
    `
    select * from img_table where userid = ? and id = ?
    `,
    [userid, id]
  );

  const [prevImage] = images.filter((image) => {
    return currentImage.id < image.id ? true : false;
  });
  if (prevImage != undefined) {
    res.json(prevImage);
  } else {
    res.json(false);
  }
});
//인스타 팔로우 유저 받아오기
app.get("/getFollowMember/:id", async (req, res) => {
  const { id } = req.params;

  const [users] = await pool.query(
    `
  SELECT *
  FROM insta a
  INNER JOIN follow_table b 
  ON a.userid = b.followedId
  WHERE b.followId = ?
  `,
    [id]
  );

  if (users.length <= 0) {
    res.json(false);
    return;
  }
  res.json(users);
});
//인스타 팔로우 게시글 받아오는것
app.get("/getFollowArticle/:id", async (req, res) => {
  const { id } = req.params;
  // SELECT *
  // FROM img_table a
  // inner join follow_table b
  // on a.userid = b.followedId
  // inner join insta c
  // on b.followedId = c.userid
  // inner join reply_table d
  // on d.articleid = a.id
  // where b.followId = ?
  // group by a.id
  const [users] = await pool.query(
    `
    SELECT *
  FROM img_table a
  inner join follow_table b
  on a.userid = b.followedId
  inner join insta c
  on b.followedId = c.userid
  inner join like_table d
  on d.articleid = a.id
  where b.followId = ?

  group by a.id
  `,
    [id]
  );

  res.json(users);
  return;
});
//게시글 저장기능
app.get("/articleSave", async (req, res) => {
  const { userid, articleid } = req.query;

  const [isSaved] = await pool.query(
    `
    select * from save_table
    where saveid = ? and
    articleid = ?
  `,
    [userid, articleid]
  );

  if (isSaved == "") {
    await pool.query(
      `
    update img_table set saved = 1 where id = ?
    `,
      [articleid]
    );

    await pool.query(
      `
    insert into save_table set 
    articleid = ?,
    saveid = ?
    `,
      [articleid, userid]
    );

    res.json(true);
  } else {
    await pool.query(
      `
    update img_table set saved = 0 where id = ?
    `,
      [articleid]
    );

    await pool.query(
      `
    delete from save_table where
    articleid = ? and
    saveid = ?
    `,
      [articleid, userid]
    );

    res.json(false);
  }
});
//프로필 수정 업데이트
app.patch("/updateProfile/:userid", async (req, res) => {
  const { userid } = req.params;
  const { usename, introduce } = req.body;

  const [userRow] = await pool.query(
    `
    select *
    from insta
    where userid = ?
    `,
    [userid]
  );
  if (userRow == undefined) {
    res.status(404).json({
      msg: "not found",
    });
  }
  const [rs] = await pool.query(
    `
    update insta
    set usename = ?,
    introduce = ?
    where userid = ?
    `,
    [usename, introduce, userid]
  );
  const [[updatedUsers]] = await pool.query(
    `
    select *
    from insta
    where userid = ?
    `,
    [userid]
  );
  res.json(updatedUsers);
});
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
