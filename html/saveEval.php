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

    /* seleccionar 'w_user' y 'b_user' de 'games', con 'id' = '$_REQUEST ["id_game"]' */
    if (!($result = pg_query ($dbconn, "select w_user, b_user from games where id_game = " . $_REQUEST ["id_game"])))
      throw new Exception ("<br />Cannot retrieve users for game " . $_REQUEST ["id_game"] . ".<br />");

    /* comparar esos dos contra '$_REQUEST ["id_user"]' y determinar si se jugo con blancas o negras */
    $arr = pg_fetch_array ($result, NULL, PGSQL_ASSOC);
    if      ($arr ["w_user"] == $_REQUEST ["id_user"])  $wb = "0";
    else if ($arr ["b_user"] == $_REQUEST ["id_user"])  $wb = "1" ;
    else throw new Exception ("<br />Cannot find user " . $_REQUEST ["id_user"] . " amongst the players.<br />");

    /* seleccionar 'id_move' de 'moves', con 'game' = '$_REQUEST ["id_game"]' y 'w_b' dependiendo de si se jugo con blancas o negras */
    if (!($result = pg_query ($dbconn, "select id_move from moves where game = " . $_REQUEST ["id_game"] . " and w_b = B'" . $wb . "' order by move_number")))
      throw new Exception ("<br />Cannot retrieve moves by " . ($wb == "1" ? "black" : "white") . " player from game " . $_REQUEST ["id_game"] . ".<br />");

    /* para cada elemento en ese ultimo resultado, hacer:
     *  si hay un MoveEval* para ese numero de movida:
     *    agregar la fila entera con 'move' = 'id_move' en esta iteracion a 'evaluation' */
    $cant = pg_num_rows ($result);
    for ($i = 1; $i <= $cant; $i++)
      if ($_REQUEST ["MoveEvalPS" . $i]
      ||  $_REQUEST ["MoveEvalPE" . $i]
      ||  $_REQUEST ["MoveEvalBl" . $i]
      ||  $_REQUEST ["MoveEvalCv" . $i]
      ||  $_REQUEST ["MoveEvalDf" . $i]
      ||  $_REQUEST ["MoveEvalCa" . $i])
        /*
        print ("insert into evaluation (move, plan_start, plan_end, blunder, creative, difficult, calculating) "
                             . "values (" . ($val = pg_fetch_result ($result, $i - 1, 0))              . ", "
                                          . ($_REQUEST ["MoveEvalPS" . $i] == "on" ? "TRUE" : "FALSE") . ", "
                                          . ($_REQUEST ["MoveEvalPE" . $i] == "on" ? "TRUE" : "FALSE") . ", "
                                          . ($_REQUEST ["MoveEvalBl" . $i] == "on" ? "TRUE" : "FALSE") . ", "
                                          . ($_REQUEST ["MoveEvalCv" . $i] == "on" ? "TRUE" : "FALSE") . ", "
                                          . ($_REQUEST ["MoveEvalDf" . $i] == "on" ? "TRUE" : "FALSE") . ", "
                                          . ($_REQUEST ["MoveEvalCa" . $i] == "on" ? "TRUE" : "FALSE") . ") <br />");
        */
        if (!(pg_query ($dbconn, "insert into evaluation (move, plan_start, plan_end, blunder, creative, difficult, calculating) "
                                               . "values (" . ($val = pg_fetch_result ($result, $i - 1, 0))              . ", "
                                                            . ($_REQUEST ["MoveEvalPS" . $i] == "on" ? "TRUE" : "FALSE") . ", "
                                                            . ($_REQUEST ["MoveEvalPE" . $i] == "on" ? "TRUE" : "FALSE") . ", "
                                                            . ($_REQUEST ["MoveEvalBl" . $i] == "on" ? "TRUE" : "FALSE") . ", "
                                                            . ($_REQUEST ["MoveEvalCv" . $i] == "on" ? "TRUE" : "FALSE") . ", "
                                                            . ($_REQUEST ["MoveEvalDf" . $i] == "on" ? "TRUE" : "FALSE") . ", "
                                                            . ($_REQUEST ["MoveEvalCa" . $i] == "on" ? "TRUE" : "FALSE") . ")")))
          {
                print ("<br />Cannot insert evaluation for move number " . $i . " (move id " . $val . ").<br />");
                $err = true;
          }

    if ($err)  throw new Exception ();

    pg_close ($dbconn);
  }

catch (Exception $e)
  {
    print ($e->getMessage () . '\n');
    if ($dbconn)  pg_close ($dbconn);
  }

?>

<head>
</head>

<body onload = "window.close ();">

</body>
