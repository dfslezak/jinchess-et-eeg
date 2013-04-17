<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<html>
  <head>
    <meta http-equiv = "CONTENT-TYPE"  content = "text/html;charset=iso-8859-1">
    <meta http-equiv = "expires"  content = "0" >
    <title>Evaluaci&oacute;n del juego</title>
    <link href = "main.css"  type = "text/css"  rel = "stylesheet" >
    <script src = "pgnview.js"  type = "text/javascript"></script>
    <?php
      /* parametros de conexion para la base */
      $host   = "localhost";
      $port   = "5432";
      $dbname = "chessExperiment";
      $user   = "dfslezak";
      $pass   = "23571113";

      try
        {
          /* conectarse a la base */
          if (!($dbconn = pg_connect ( " host     = " . $host
                                     . " port     = " . $port
                                     . " dbname   = " . $dbname
                                     . " user     = " . $user
                                     . " password = " . $pass)))
            throw new Exception ("<br />Cannot connect to database " . $dbname . " on host " . $host . " at port " . $port . " with user " . $user . ".<br />");

          /* buscar los datos relevantes del juego */
          if (!($result = pg_query ($dbconn, "select w_user, b_user, result_comment from games where id_game = " . $_REQUEST ["id_game"])))
            throw new Exception ("<br />Cannot retrieve game " . $_REQUEST ["id_game"] . ".<br />");

          /* ver si existe */
          if (!($game = pg_fetch_array ($result, NULL, PGSQL_ASSOC)))
            throw new Exception ("<br />Non-existing game " . $_REQUEST ["id_game"] . ".<br />");

          /* seleccionar el nombre del usuario blanco */
          if (!($result = pg_query ($dbconn, "select username from users where id_user = " . $game ["w_user"])))
            throw new Exception ("<br />Cannot retrieve white user for game " . $_REQUEST ["id_game"] . ".<br />");

          /* ver si existe */
          if (!($w_user = pg_fetch_result ($result, 0, 0)))
            throw new Exception ("<br />Non-existing user " . $game ["w_user"] . ".<br />");

          /* seleccionar el nombre del usuario negro */
          if (!($result = pg_query ($dbconn, "select username from users where id_user = " . $game ["b_user"])))
            throw new Exception ("<br />Cannot retrieve black user for game " . $_REQUEST ["id_game"] . ".<br />");

          /* ver si existe */
          if (!($b_user = pg_fetch_result ($result, 0, 0)))
            throw new Exception ("<br />Non-existing user " . $game ["b_user"] . ".<br />");

          /* buscar las movidas */
          if (!($result = pg_query ($dbconn, "select move_number, move_type, w_b from moves where game = " . $_REQUEST ["id_game"] . " order by move_number, w_b")))
            throw new Exception ("<br />Cannot retrieve moves for game " . $_REQUEST ["id_game"] . ".<br />");

          /* armar las movidas */
          $line = "[White \"" . $w_user . "\"][Black \"" . $b_user . "\"][LongResult \"" . $game ["result_comment"] . "\"]";
          while ($move = pg_fetch_array ($result, NULL, PGSQL_ASSOC))
            if ($move ["w_b"] == "1")  $line .=                                $move ["move_type"] . " ";
            else                       $line .= $move ["move_number"] . ". " . $move ["move_type"] . " ";

          /* imprimir el cacho de js que hace falta */
          print ( "<script type = \"text/javascript\">\n"
                . "  pgnGame = " . "'" . $line . "'"     . ";\n"
                . "  id_user = " . $_REQUEST ["id_user"] . ";\n"
                . "  id_game = " . $_REQUEST ["id_game"] . ";\n"
                . "</script>");

          /* cerrar todo */
          pg_close ($dbconn);
        }

      catch (Exception $e)
        {
          print ($e->getMessage () . '\n');
          if ($dbconn)  pg_close ($dbconn);
        }
    ?>
  </head>
  <body onload = "javascript:Init ('standard'); MoveForward (MaxMove)">
    <div id = "navi_top">
      <div class = "firstline">
        <ul><li>Evaluaci&oacute;n del juego</li></ul>
      </div>
    </div>
    <table width = "900"  style = "border-style:none;"  align = "center">
      <tr>
        <td>
          <div id = "GameText"></div>
        </td>
        <td>
          <FORM action = "saveEval.php"  method = "POST">
            <div id = "GameEval"></div>
          </FORM>
        </td>
      </tr>
    </table>
  </body>
</html>
