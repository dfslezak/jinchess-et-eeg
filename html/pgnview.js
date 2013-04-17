
// ficsgames.com pgn viewer version 0.19r
// derived from LT PGN Viewer, see http://www.lutanho.net/pgn/pgnviewer.html

var i;

var pgnGame;
var id_game;
var id_user;
/*
 *  Ejemplo:
 *
 *  '[White "tobytats"][Black "zinoukako"][TimeControl "600+0"][Date "2010-05-17"][LongResult "Black resigns"]1. e4 {0.0} e5 {0.0} 2. Bc4 {1.015} Nf6 {4.531} 3. Nc3 {5.453} Nc6 {1.969} 4. Nf3 {12.297} h6 {8.016} 5. Bxf7+ {6.469} Kxf7 {3.687} 6. O-O {1.093} d5 {10.141} 7. exd5 {25.828} Nxd5 {2.5} 8. Ne4 {26.906} Bf5 {13.219} 9. Ng3 {8.812} g6 {4.734} 10. Nxf5 {8.735} gxf5 {1.859} 11. d3 {22.562} e4 {3.562} 12. dxe4 {4.937} fxe4 {1.61} 13. Nd2 {22.016} Qg5 {12.969} 14. Nxe4 {11.907} Qe5 {11.89} 15. Qf3+ {9.968} Ke7 {16.578} 16. Nc5 {15.235} Nd4 {3.266} 17. Qa3 {21.469} Qd6 {54.453} 18. Re1+ {18.531} Kd8 {4.968} 19. Nxb7+ {3.204} Kc8 {4.718} 20. Nxd6+ {3.156} Bxd6 {1.938} 21. Qd3 {10.515} Nf4 {27.094} 22. Qxd4 {6.078} Rg8 {2.86} 23. Bxf4 {5.546} Bxf4 {1.937} 24. Qxf4 {0.937}'
 *
 *  Los campos son:
 *
 *    [White <nombre>]  string con el nombre del jugador blanco
 *    [Black <nombre>]  string con el nombre del jugador negro
 *    [TimeControl <control>]  string de la forma <base>+<bonus> donde <base> es la cantidad de tiempo limite y <bonus> es el tiempo que se agrega por movida
 *    [LongResult <resultado>]  string con el resultado del partido
 *    1. e4 {0.0} e5 {0.0}            lista de movimientos con el tiempo en segundos que tardo cada jugador entre llaves
 *    2. Bc4 {1.015} Nf6 {4.531}
 *    3. Nc3 {5.453} Nc6 {1.969}
 *    4. Nf3 {12.297} h6 {8.016}
 *    5. Bxf7+ {6.469} Kxf7 {3.687}
 *    6. O-O {1.093} d5 {10.141}
 *    7. exd5 {25.828} Nxd5 {2.5}
 *    ...
 *
 */

var loaded = false;

/*
 * Global variables holding game tags.
 */
var gameWhite;
var gameBlack;
var gameLongResult;
var gameTimeControl;
var gameTimeControlTime;
var gameMoveTimesAvail = 0;

var oldAnchor = -1;

var isAutoPlayOn = false;
var AutoPlayInterval;
var Delay = 1;                /* default is fast */

var MaxMove = 500;

var castleRook    = -1;
var mvCapture     =  0;
var mvIsCastling  =  0;
var mvIsPromotion =  0;
var mvFromCol     = -1;
var mvFromRow     = -1;
var mvToCol       = -1;
var mvToRow       = -1;
var mvPiece       = -1;
var mvPieceId     = -1;
var mvPieceOnTo   = -1;
var mvCaptured    = -1;
var mvCapturedId  = -1;

var enPassant    =  false;
var enPassantCol = -1;

Board = new Array (8);
for (i = 0; i < 8; ++i)
  Board [i] = new Array (8);

LabelPic = new Array (5);

HistCol          = new Array (2);
HistRow          = new Array (2);
HistPieceId      = new Array (2);
HistType         = new Array (2);

PieceCol         = new Array (2);
PieceRow         = new Array (2);
PieceType        = new Array (2);
PieceMoveCounter = new Array (2);

MoveEvalPlanStart   = new Array (MaxMove);
MoveEvalPlanEnd     = new Array (MaxMove);
MoveEvalBlunder     = new Array (MaxMove);
MoveEvalCreative    = new Array (MaxMove);
MoveEvalDifficult   = new Array (MaxMove);
MoveEvalCalculating = new Array (MaxMove);

for (i = 0; i < MaxMove; i++)
  MoveEvalPlanStart   [i] =
  MoveEvalPlanEnd     [i] =
  MoveEvalBlunder     [i] =
  MoveEvalCreative    [i] =
  MoveEvalDifficult   [i] =
  MoveEvalCalculating [i] = false;

for (i = 0; i < 2; ++i)
  {
    HistCol [i]          = new Array (MaxMove);
    HistRow [i]          = new Array (MaxMove);
    HistType [i]         = new Array (MaxMove);
    HistPieceId [i]      = new Array (MaxMove);

    PieceCol [i]         = new Array (16);
    PieceRow [i]         = new Array (16);
    PieceType [i]        = new Array (16);
    PieceMoveCounter [i] = new Array (16);
  }

PiecePicture = new Array (2);
for (i = 0; i < 2; ++i) PiecePicture [i] = new Array (6);

PieceCode     = new Array (6);
PieceCode [0] = "K";
PieceCode [1] = "Q";
PieceCode [2] = "R";
PieceCode [3] = "B";
PieceCode [4] = "N";
PieceCode [5] = "P";

Moves      = new Array (MaxMove);
MovesTimes = new Array (MaxMove);

var MoveColor;
var MoveCount;
var PlyNumber;
var StartPly;

var IsRotated = false;

ClearImg = new Image ();

DocumentImages = new Array ();

function CheckLegality (what, plyCount)
  {
    var retVal;

    /*
     * Is it a castling move
     */
    if (what == 'O-O')
      {
        retVal = CheckLegalityOO ();

        StoreMove (plyCount);
        return retVal;
      }
    else if (what == 'O-O-O')
      {
        retVal = CheckLegalityOOO ();

        StoreMove (plyCount);
        return retVal;
      }
    /*
     * It is a piece move. Loop over all pieces and find the ones of the same
     * type as the one in the move. For each one of these check if they could
     * have made the move.
     */
    var pieceId;
    for (pieceId = 0; pieceId < 16; ++pieceId)
      if (PieceType [MoveColor][pieceId] == mvPiece)
        {
          if      (mvPiece == 1)  retVal = CheckLegalityKing   (pieceId);
          else if (mvPiece == 2)  retVal = CheckLegalityQueen  (pieceId);
          else if (mvPiece == 3)  retVal = CheckLegalityRook   (pieceId);
          else if (mvPiece == 4)  retVal = CheckLegalityBishop (pieceId);
          else if (mvPiece == 5)  retVal = CheckLegalityKnight (pieceId);
          else if (mvPiece == 6)  retVal = CheckLegalityPawn   (pieceId);

          if (retVal)
            {
              mvPieceId = pieceId;
              /*
               * Now that the board is updated check if the king is in check.
               */
              StoreMove (plyCount);
            }
        }

    return true;
  }


function CheckLegalityKing (thisKing)
  {
    if ((mvFromCol >= 0) && (mvFromCol != PieceCol [MoveColor][thisKing])) return false;
    if ((mvFromRow >  0) && (mvFromRow != PieceRow [MoveColor][thisKing])) return false;

    if (Math.abs (PieceCol [MoveColor][thisKing] - mvToCol) > 1) return false;
    if (Math.abs (PieceRow [MoveColor][thisKing] - mvToRow) > 1) return false;

    return true;
  }


function CheckLegalityQueen (thisQueen)
  {
    if ((mvFromCol >= 0) && (mvFromCol != PieceCol [MoveColor][thisQueen])) return false;
    if ((mvFromRow >= 0) && (mvFromRow != PieceRow [MoveColor][thisQueen])) return false;

    if (((PieceCol [MoveColor][thisQueen] - mvToCol) * (PieceRow [MoveColor][thisQueen] - mvToRow) != 0) &&
        (Math.abs (PieceCol [MoveColor][thisQueen] - mvToCol) != Math.abs (PieceRow [MoveColor][thisQueen] - mvToRow))) return false;

    if (!CheckClearWay (thisQueen)) return false;

    return true;
  }


function CheckLegalityRook (thisRook)
  {
    if ((mvFromCol >= 0) && (mvFromCol != PieceCol [MoveColor][thisRook])) return false;
    if ((mvFromRow >= 0) && (mvFromRow != PieceRow [MoveColor][thisRook])) return false;

    if ((PieceCol [MoveColor][thisRook] - mvToCol) * (PieceRow [MoveColor][thisRook] - mvToRow) != 0) return false;

    if (!CheckClearWay (thisRook)) return false;

    return true;
  }


function CheckLegalityBishop (thisBishop)
  {
    if ((mvFromCol >= 0) && (mvFromCol != PieceCol [MoveColor][thisBishop])) return false;
    if ((mvFromRow >= 0) && (mvFromRow != PieceRow [MoveColor][thisBishop])) return false;

    if (Math.abs (PieceCol [MoveColor][thisBishop] - mvToCol) != Math.abs (PieceRow [MoveColor][thisBishop] - mvToRow)) return false;

    if (!CheckClearWay (thisBishop)) return false;

    return true;
  }


function CheckLegalityKnight (thisKnight)
  {
    if ((mvFromCol >= 0) && (mvFromCol != PieceCol [MoveColor][thisKnight])) return false;
    if ((mvFromRow >= 0) && (mvFromRow != PieceRow [MoveColor][thisKnight])) return false;

    if (Math.abs (PieceCol [MoveColor][thisKnight] - mvToCol) * Math.abs (PieceRow [MoveColor][thisKnight] - mvToRow) != 2) return false;

    return true;
  }


function CheckLegalityPawn (thisPawn)
  {
    if ((mvFromCol >= 0) && (mvFromCol != PieceCol [MoveColor][thisPawn])) return false;
    if ((mvFromRow >= 0) && (mvFromRow != PieceRow [MoveColor][thisPawn])) return false;

    if (Math.abs (PieceCol [MoveColor][thisPawn] - mvToCol) != mvCapture) return false;

    if (mvCapture)
      {
        if (PieceRow [MoveColor][thisPawn] - mvToRow != 2 * MoveColor - 1) return false;
      }
    else
      {
        if (PieceRow [MoveColor][thisPawn] - mvToRow == 4 * MoveColor - 2)
          {
            if (PieceRow [MoveColor][thisPawn] != 1 + 5 * MoveColor) return false;
            if (Board [mvToCol][mvToRow + 2 * MoveColor - 1] != 0)   return false;
          }
        else
          {
            if (PieceRow [MoveColor][thisPawn] - mvToRow != 2 * MoveColor - 1) return false;
          }
      }

    return true;
  }


function CheckLegalityOO ()
  {
    /*
     * Find which rook was involved in the castling.
     */
    for (castleRook = 0; castleRook < 16; ++castleRook)
      if ((PieceCol  [MoveColor][castleRook] >  PieceCol [MoveColor][0]) &&
          (PieceRow  [MoveColor][castleRook] == MoveColor * 7)           &&
          (PieceType [MoveColor][castleRook] == 3))
        break;

    /*
     * Check no piece is between the king and the rook. To make it compatible
     * with fisher-random rules clear the king and rook squares now.
     */
    Board [PieceCol [MoveColor][       0]][MoveColor * 7] = 0;
    Board [PieceCol [MoveColor][castleRook]][MoveColor * 7] = 0;

    return true;
  }


function CheckLegalityOOO ()
  {
    /*
     * Find which rook was involved in the castling.
     */
    for (castleRook = 0; castleRook < 16; ++castleRook)
      if ((PieceCol  [MoveColor][castleRook] <  PieceCol [MoveColor][0]) &&
          (PieceRow  [MoveColor][castleRook] == MoveColor * 7)           &&
          (PieceType [MoveColor][castleRook] == 3))
        break;

    /*
     * Check no piece is between the king and the rook. To make it compatible
     * with fisher-random rules clear the king and rook squares now.
     */
    Board [PieceCol[MoveColor][       0]][MoveColor * 7] = 0;
    Board [PieceCol[MoveColor][castleRook]][MoveColor * 7] = 0;

    return true;
  }


function CheckClearWay (thisPiece)
  {
    var stepCol = sign (mvToCol - PieceCol [MoveColor][thisPiece]);
    var stepRow = sign (mvToRow - PieceRow [MoveColor][thisPiece]);

    var startCol = PieceCol [MoveColor][thisPiece] + stepCol;
    var startRow = PieceRow [MoveColor][thisPiece] + stepRow;

    while ((startCol != mvToCol) || (startRow != mvToRow))
      {
        if (Board [startCol][startRow] != 0) return false;
        startCol += stepCol;
        startRow += stepRow;
      }

    return true;
  }


function ClearMove (move)
  {
    var cc = -1;
    var mm = "";

    for (ii = 0; ii < move.length; ++ii)
      {
        cc = move.charCodeAt (ii);
        if ((cc == 45) || ((cc >= 48) && (cc <= 57)) || (cc == 61) || ((cc >= 65) && (cc <= 90)) || ((cc >= 97) && (cc <= 122)))
          mm += move.charAt (ii);
      }

    return mm;
  }


function GoToMove (thisMove)
  {
    var currentPly = document.BoardForm.CurrentPly.value;
    var diff       = thisMove - currentPly;

    if (diff > 0) MoveForward  ( diff);
    else          MoveBackward (-diff);
  }


/******************************************************************************
 *                                                                            *
 * Function HighlightLastMove:                                                *
 *                                                                            *
 * Show a text with the last move played and highlight the anchor to it.      *
 *                                                                            *
 ******************************************************************************/
function HighlightLastMove ()
  {
    var theShowMoveTextObject   = document.getElementById ("ShowLastMove"  );

    /*
     * Remove the highlighting from the old anchor if any.
     */
    if (oldAnchor >= 0)
      {
        theAnchor           = document.getElementById('Mv' + oldAnchor);
        theAnchor.className = 'move';
      }

    /*
     * Find which move has to be highlighted. If the move number is negative
     * we are at the starting position and nothing is to be highlighted and
     * the header on top of the board is removed.
     */
    var showThisMove = document.BoardForm.CurrentPly.value - 1;
    if (showThisMove > PlyNumber) showThisMove = PlyNumber;

    if (showThisMove < 0)
      {
        theShowMoveTextObject           = document.getElementById ("ShowLastMove");
        theShowMoveTextObject.innerHTML = 'Start Position';
        theShowMoveTextObject.className = 'ShowLastMove';

        text = gameTimeControlTime;

        return;
      };

    /*
     * Update the header of the board.
     */
    move = Moves [showThisMove];
    theShowMoveTextObject = document.getElementById ("ShowLastMove");
    var text = 'Position after: ';
    var mvNum = Math.floor (showThisMove / 2) + 1;
    if (showThisMove % 2 == 0) text += mvNum + '. '    ;
    else                       text += mvNum + '. ... ';

    text += move;
    theShowMoveTextObject.innerHTML = text;
    theShowMoveTextObject.className = 'ShowLastMove';

    /*
     * Highlight the new move anchor and store it.
     */
    showThisMove++;
    theAnchor           = document.getElementById ('Mv' + showThisMove);
    theAnchor.className = 'moveOn';
    oldAnchor           = showThisMove;
  }


/******************************************************************************
 *                                                                            *
 * Function Init:                                                             *
 *                                                                            *
 * Load the game from the HTML.                                               *
 *                                                                            *
 ******************************************************************************/
function Init ()
  {
    if (isAutoPlayOn) SetAutoPlay (false);

    InitFEN ();

    /*
     * Save the starting move number and refresh
     */
    if (!loaded)
      {
        InitImages ();
        LoadGameHeaders ();
        ParsePGNGameString (pgnGame);
        PrintAdjudicateHTML();

        loaded = true;
      }

    RefreshBoard ();
    document.BoardForm.CurrentPly.value = StartPly;
    HighlightLastMove ();
  }


/******************************************************************************
 *                                                                            *
 * Function InitFEN:                                                          *
 *                                                                            *
 * Prepare the starting position from the FEN.                                *
 *                                                                            *
 ******************************************************************************/
function InitFEN ()
  {
    /*
     * Reset the board;
     */
    var ii, jj;
    for (ii = 0; ii < 8; ++ii)
      for (jj = 0; jj < 8; ++jj)
        Board [ii][jj] = 0;

    /*
     * Set the initial position. As of now only the normal starting position.
     */
    var color, pawn;
    StartPly  = 0;
    MoveCount = StartPly;
    MoveColor = StartPly % 2;
    enPassant = false;

    for (color = 0; color < 2; ++color)
      {
        PieceType [color][0] = 1;  PieceCol  [color][0] = 4;  // King
        PieceType [color][1] = 2;  PieceCol  [color][1] = 3;  // Queen
        PieceType [color][2] = 5;  PieceCol  [color][2] = 1;  // Knights
        PieceType [color][3] = 5;  PieceCol  [color][3] = 6;
        PieceType [color][4] = 4;  PieceCol  [color][4] = 2;  // Bishops
        PieceType [color][5] = 4;  PieceCol  [color][5] = 5;
        PieceType [color][6] = 3;  PieceCol  [color][6] = 0;  // Rooks
        PieceType [color][7] = 3;  PieceCol  [color][7] = 7;

        for (pawn = 0; pawn < 8; ++pawn)
          {
            PieceType [color][pawn + 8] = 6;
            PieceCol  [color][pawn + 8] = pawn;
          }

        for (ii = 0; ii < 16; ++ii)
          {
            PieceMoveCounter [color][ii] = 0;
            PieceRow         [color][ii] = (1 - color) * Math.floor (ii / 8) + color * (7 - Math.floor (ii / 8));
          }

        for (ii = 0; ii < 16; ii++)
          Board [PieceCol [color][ii]][PieceRow [color][ii]] = (1 - 2 * color) * PieceType [color][ii];
      }
  }


/******************************************************************************
 *                                                                            *
 * Function InitImages:                                                       *
 *                                                                            *
 * Load all chess men images.                                                 *
 *                                                                            *
 ******************************************************************************/
function InitImages ()
  {
    /*
     * No image.
     */
    ClearImg.src = './clear.gif';

    /*
     * Load the images.
     */
    (PiecePicture [0][1] = new Image ()).src = './wk.gif';  /* white king   */
    (PiecePicture [0][2] = new Image ()).src = './wq.gif';  /* white queen  */
    (PiecePicture [0][3] = new Image ()).src = './wr.gif';  /* white rook   */
    (PiecePicture [0][4] = new Image ()).src = './wb.gif';  /* white bishop */
    (PiecePicture [0][5] = new Image ()).src = './wn.gif';  /* white knight */
    (PiecePicture [0][6] = new Image ()).src = './wp.gif';  /* white pawn   */
    (PiecePicture [1][1] = new Image ()).src = './bk.gif';  /* black king   */
    (PiecePicture [1][2] = new Image ()).src = './bq.gif';  /* black queen  */
    (PiecePicture [1][3] = new Image ()).src = './br.gif';  /* black rook   */
    (PiecePicture [1][4] = new Image ()).src = './bb.gif';  /* black bishop */
    (PiecePicture [1][5] = new Image ()).src = './bn.gif';  /* black knight */
    (PiecePicture [1][6] = new Image ()).src = './bp.gif';  /* black pawn   */

    (LabelPic [0] = new Image ()).src = './8_1.gif';
    (LabelPic [1] = new Image ()).src = './a_h.gif';
    (LabelPic [2] = new Image ()).src = './1_8.gif';
    (LabelPic [3] = new Image ()).src = './h_a.gif';

    /*
     * Keep memory of the directory. Reset the array describing what image is
     * in each square.
     */
    DocumentImages.length = 0;
  }


function IsCheck (col, row, color)
  {
    var ii, jj;
    var sign = 2 * color - 1; // white or black

    /*
     * Is the other king giving check?
     */
    if ((Math.abs (PieceCol [1 - color][0] - col) <= 1) && (Math.abs (PieceRow [1 - color][0] - row) <= 1)) return true;

    /*
     * Any knight giving check?
     */
    for (ii = -2; ii <= 2; ii += 4)
      for(jj = -1; jj <= 1; jj += 2)
        if ((SquareOnBoard (col + ii, row + jj) && (Board [col + ii][row + jj] == sign * 5)) ||
            (SquareOnBoard (col + jj, row + ii) && (Board [col + jj][row + ii] == sign * 5))) return true;

    /*
     * Any pawn giving check?
     */
    for (ii = -1; ii <= 1; ii += 2)
      if (SquareOnBoard (col + ii, row + sign) && (Board [col + ii][row - sign] == sign * 6)) return true;

    /*
     * Now queens, rooks and bishops.
     */
    for (ii = -1; ii <= 1; ++ii)
      for (jj = -1; jj <= 1; ++jj)
        if ((ii != 0) || (jj != 0))
          {
            var checkCol  = col + ii;
            var checkRow  = row + jj;
            var thisPiece = 0;

            while (SquareOnBoard (checkCol, checkRow) && (thisPiece == 0))
              if ((thisPiece = Board [checkCol][checkRow]) == 0) { checkCol += ii; checkRow += jj; }
              else if ( (thisPiece == sign * 2)                              ||
                       ((thisPiece == sign * 3) && ((ii == 0) || (jj == 0))) ||
                       ((thisPiece == sign * 4) && ((ii != 0) && (jj != 0)))) return true;
          }

    return false;
  }


/******************************************************************************
 *                                                                            *
 * Function LoadGameHeaders:                                                  *
 *                                                                            *
 * Parse the string containing the PGN score of the game and extract the      *
 * date, the white and black players and the result. Store them in global     *
 * arrays.                                                                    *
 *                                                                            *
 ******************************************************************************/
function LoadGameHeaders ()
  {
    var tag = /\[(\w+)\s+\"([^\"]+)\"\]/g;
    var parse;

    /*
     * Read the headers of all games and store the information in te global
     * arrays
     */
    while ((parse = tag.exec (pgnGame)) != null)
      if      (parse [1] == 'White'            ) gameWhite       = parse [2];
      else if (parse [1] == 'Black'            ) gameBlack       = parse [2];
      else if (parse [1] == 'LongResult'       ) gameLongResult  = parse [2];
      else if (parse [1] == 'TimeControl'      ) gameTimeControl = parse [2];

    return;
  }


/******************************************************************************
 *                                                                            *
 * Function MoveBackward:                                                     *
 *                                                                            *
 * Move back in the game by "diff" moves. The old position is reconstructed   *
 * using the various "Hist" arrays.                                           *
 *                                                                            *
 ******************************************************************************/
function MoveBackward (diff)
  {
    /*
     * First of all find to which ply we have to go back. Remember that
     * document.BoardForm.CurrentPly.value contains the ply number counting
     * from 1.
     */
    var currentPly = document.BoardForm.CurrentPly.value;
    var goFromPly  = currentPly - 1;
    var goToPly    = goFromPly  - diff;
    if (goToPly < StartPly) goToPly = StartPly - 1;

    /*
     * Loop back to reconstruct the old position one ply at the time.
     */
    var thisPly;
    for (thisPly = goFromPly; thisPly > goToPly; --thisPly)
      {
        currentPly--;
        MoveColor = 1 - MoveColor;

        /*
         * Reposition the moved piece on the original square.
         */
        var chgPiece = HistPieceId [0][thisPly];
        Board [PieceCol [MoveColor][chgPiece]][PieceRow [MoveColor][chgPiece]] = 0;
        Board [HistCol  [        0][ thisPly]][HistRow  [        0][ thisPly]] = HistType [0][thisPly] * (1 - 2 * MoveColor);

        PieceType       [MoveColor][chgPiece] = HistType [0][thisPly];
        PieceCol        [MoveColor][chgPiece] = HistCol  [0][thisPly];
        PieceRow        [MoveColor][chgPiece] = HistRow  [0][thisPly];
        PieceMoveCounter[MoveColor][chgPiece]--;

        /*
         * If the move was a castling reposition the rook on its original square.
         */
        chgPiece = HistPieceId [1][thisPly];
        if ((chgPiece >= 0) && (chgPiece < 16))
          {
            Board [PieceCol [MoveColor][chgPiece]][PieceRow [MoveColor][chgPiece]] = 0;
            Board [HistCol  [        1][ thisPly]][HistRow  [        1][ thisPly]] = HistType [1][thisPly] * (1 - 2 * MoveColor);

            PieceType        [MoveColor][chgPiece] = HistType [1][thisPly];
            PieceCol         [MoveColor][chgPiece] = HistCol  [1][thisPly];
            PieceRow         [MoveColor][chgPiece] = HistRow  [1][thisPly];
            PieceMoveCounter [MoveColor][chgPiece]--;
          }

        /*
         * If the move was a capture reposition the captured piece on its
         * original square.
         */
        chgPiece -= 16;
        if ((chgPiece >= 0) && (chgPiece < 16))
          {
            Board [PieceCol [1 - MoveColor][chgPiece]][PieceRow [1 - MoveColor][chgPiece]] = 0;
            Board [HistCol  [            1][ thisPly]][HistRow  [            1][ thisPly]] = HistType [1][thisPly] * (2 * MoveColor - 1);

            PieceType        [1 - MoveColor][chgPiece] = HistType [1][thisPly];
            PieceCol         [1 - MoveColor][chgPiece] = HistCol  [1][thisPly];
            PieceRow         [1 - MoveColor][chgPiece] = HistRow  [1][thisPly];
            PieceMoveCounter [1 - MoveColor][chgPiece]--;
          }
      }
    /*
     * Now that we have the old position refresh the board and update the
     * ply count on the HTML.
     */
    document.BoardForm.CurrentPly.value = currentPly;
    RefreshBoard ();
    HighlightLastMove ();

    /*
     * Set a new timeout if in autoplay mode.
     */
    if (AutoPlayInterval) clearTimeout (AutoPlayInterval);
    if (isAutoPlayOn) AutoPlayInterval = setTimeout ("MoveBackward (1)", SetDelayValue ());
  }


/******************************************************************************
 *                                                                            *
 * Function MoveForward:                                                      *
 *                                                                            *
 * Move forward in the game by "diff" moves. The new position is found        *
 * parsing the array containing the moves and "executing" them.               *
 *                                                                            *
 ******************************************************************************/
function MoveForward (diff)
  {
    /*
     * First of all find to which ply we have to go back. Remember that
     * document.BoardForm.CurrentPly.value contains the ply number counting
     * from 1.
     */
    var currentPly  = document.BoardForm.CurrentPly.value;
    var goToPly     = parseInt (currentPly) + parseInt (diff);

    if (goToPly > (StartPly + PlyNumber)) goToPly = StartPly + PlyNumber;

    /*
     * Loop over all moves till the selected one is reached. Check that
     * every move is legal and if yes update the board.
     */
    var ii;
    for (ii = currentPly; ii < goToPly; ++ii)
      {
        ParseMove (Moves [ii], ii);
        MoveColor = 1 - MoveColor;
      }

    /*
     * Once the desired position is reached refresh the board and update the
     * ply count on the HTML.
     */
    document.BoardForm.CurrentPly.value = goToPly;
    RefreshBoard ();
    HighlightLastMove ();

    /*
     * Set a new timeout if in autoplay mode.
     */
    if (AutoPlayInterval) clearTimeout (AutoPlayInterval);
    if (isAutoPlayOn) AutoPlayInterval = setTimeout ("MoveForward (1)", SetDelayValue ());
  }


function GetComment (ss)
  {
    if (!ss) return ss;

    var ii, jj, llist = ss.split ("}"), ll = llist.length, uu = "", tt, kk;

    for (ii = 0; ii < ll; ii++) { tt = llist [ii]; jj = tt.indexOf ("{") + 1; if (jj > 0) uu += tt.substring (jj); }

    return uu;
  }


/******************************************************************************
 *                                                                            *
 * Function ParsePGNGameString:                                               *
 *                                                                            *
 * Extract all moves from the PGN string and store them.                      *
 *                                                                            *
 ******************************************************************************/

function ParsePGNGameString (gameString)
  {
    var ss      = gameString;
    var lastKet = ss.lastIndexOf (']');

    /*
     * Get rid of the PGN tags and remove the result at the end.
     */
    ss = ss.substring (++lastKet, ss.length);
    ss = ss.replace (/\s+/g, ' ');
    ss = ss.replace (/^\s/, '');
    ss = ss.replace (/1-0/, '');
    ss = ss.replace (/0-1/, '');
    ss = ss.replace (/1\/2-1\/2/, '');
    ss = ss.replace (/\*/, '');
    ss = ss.replace (/\s$/, '');

    PlyNumber = 0;
    var moveCount  = Math.floor (PlyNumber / 2) + 1;
    var searchThis = moveCount + '.';
    var start      = ss.indexOf (searchThis, 0);
    var end, move, startcomment, endcomment, MoveTime;
    MovesTimes [StartPly + PlyNumber] = 0;

    while (start >= 0)
      {
        /* search for next move */
        start += searchThis.length + 1;
        end  = ss.indexOf   (' ', start); if (end < 0) end = ss.length;
        move = ss.substring (start, end);

        Moves      [StartPly + PlyNumber] = ClearMove (move);
        MovesTimes [StartPly + PlyNumber] = 0;
        PlyNumber++;

        /* looking for comments */
        startcomment = ss.indexOf ("{", end);
        while (startcomment == end + 1)
          {
            // we found comment(s) after first half-move
            endcomment = ss.indexOf ("}", end);

            MoveTime = GetComment (ss.substring (startcomment, endcomment));
            if (!isNaN (MoveTime))
              {
                // if the comment is a number, treat it as move time, otherwise treat it as a comment and display it
                gameMoveTimesAvail = 1;
                MovesTimes [StartPly + PlyNumber - 1] = MoveTime;
              }

            start = endcomment + 2; // skip the space behind the comment
            end = start - 1; if (start >= ss.length) break;

            startcomment = ss.indexOf ("{", end);
          }

        start = end + 1;
        if ((start >= ss.length) || (end >= ss.length)) break;

        end = ss.indexOf (' ', start); // next move
        if (end < 0) end = ss.length;

        move = ss.substring (start, end);
        Moves      [StartPly + PlyNumber] = ClearMove (move);
        MovesTimes [StartPly + PlyNumber] = 0;
        PlyNumber++;

        /* looking for comments */
        startcomment = ss.indexOf ("{", end);
        while (startcomment == end + 1)
          {
            // we found comment(s) after first half-move
            endcomment = ss.indexOf ("}", end);
            if (endcomment < 0) { alert ("Error in move list: closing comment bracket } not found."); break; }

            MoveTime = GetComment (ss.substring (startcomment, endcomment));
            if (!isNaN (MoveTime))
              {
                // if the comment is a number, treat it as move time, otherwise discard it
                MovesTimes [StartPly + PlyNumber - 1] = MoveTime;
              }

            start = endcomment + 2; // skip the space behind the comment
            end = start - 1;
            if (start >= ss.length) break;
            startcomment = ss.indexOf ("{", end);
          }

        start = end + 1;
        if ((start >= ss.length) || (end >= ss.length)) break;

        moveCount  = Math.floor (PlyNumber / 2) + 1;
        searchThis = moveCount + '.';
        start      = ss.indexOf (searchThis, end);
      }
  }


/******************************************************************************
 *                                                                            *
 * Function ParseMove:                                                        *
 *                                                                            *
 * Given a move exctract which piece moves, from which square and to which    *
 * square. Check if the move is legal, but do not check just yet of the       *
 * king is left in check. Take into account castling, promotion and captures  *
 * including the en passant capture.                                          *
 *                                                                            *
 ******************************************************************************/
function ParseMove (move, plyCount)
  {
    var ii, ll;
    var toRowMarker = -1;

    /*
     * Reset the global move variables.
     */
    castleRook    = -1;
    mvIsCastling  =  0;
    mvIsPromotion =  0;
    mvCapture     =  0;
    mvFromCol     = -1;
    mvFromRow     = -1;
    mvToCol       = -1;
    mvToRow       = -1;
    mvPiece       = -1;
    mvPieceId     = -1;
    mvPieceOnTo   = -1;
    mvCaptured    = -1;
    mvCapturedId  = -1;

    /*
     * Given the move as something like Rdxc3 or exf8=Q+ extract the destination
     * column and row and remember whatever is left of the string.
     */
    for (ii = 1; ii < move.length; ii++)
      if (!isNaN (move.charAt (ii)))
        {
          mvToCol     = move.charCodeAt (   ii - 1) - 97;
          mvToRow     = move.charAt     (   ii    ) -  1;
          reminder    = move.substring  (0, ii - 1);
          toRowMarker = ii;
        }

    /*
     * The final square did not make sense, maybe it is a castle.
     */
    if ((mvToCol < 0) || (mvToCol > 7) || (mvToRow < 0) || (mvToRow > 7))
      if ((move.indexOf ('O') >= 0) || (move.indexOf ('0') >= 0))
        {
          /*
           * Do long castling first since looking for o-o will get it too.
           */
          if ((move.indexOf ('O-O-O') >= 0) || (move.indexOf ('0-0-0') >= 0))
            {
              mvIsCastling = 1;
              mvPiece      = 1;
              mvPieceId    = 0;
              mvPieceOnTo  = 1;
              mvFromCol    = 4;
              mvToCol      = 2;
              mvFromRow    = 7 * MoveColor;
              mvToRow      = 7 * MoveColor;

              return CheckLegality ('O-O-O', plyCount);
            }

          if ((move.indexOf('O-O') >= 0) || (move.indexOf('0-0') >= 0))
            {
              mvIsCastling = 1;
              mvPiece      = 1;
              mvPieceId    = 0;
              mvPieceOnTo  = 1;
              mvFromCol    = 4;
              mvToCol      = 6;
              mvFromRow    = 7 * MoveColor;
              mvToRow      = 7 * MoveColor;
              return CheckLegality ('O-O', plyCount);
            }
        }

    /*
     * Now extract the piece and the origin square. If it is a capture (the 'x'
     * is present) mark the as such.
     */
    mvPiece = 6;

    ll = reminder.length;
    if (ll > 0)
      {
        for(ii = 1; ii < 6; ++ii) { if (reminder.charAt (0) == PieceCode [ii - 1]) mvPiece = ii; }

        if (reminder.charAt (ll - 1) == 'x') mvCapture = 1;

        if (isNaN (move.charAt (ll - 1 - mvCapture)))
          {
            mvFromCol = move.charCodeAt (ll - 1 - mvCapture) - 97;
            if ((mvFromCol < 0) || (mvFromCol > 7)) mvFromCol = -1;
          }
        else
          {
            mvFromRow = move.charAt (ll - 1 - mvCapture) - 1;
            if ((mvFromRow < 0) || (mvFromRow > 7)) mvFromRow = -1;
          }
      }
    mvPieceOnTo = mvPiece;

    /*
     * If the to square is occupied mark the move as capture. Take care of
     * the special en passant case.
     */
    if ((Board [mvToCol][mvToRow] != 0) || ((mvPiece == 6) && (enPassant) && (mvToCol == enPassantCol) && (mvToRow == 5 - 3 * MoveColor)))
      mvCapture = 1;

    /*
     * Take care of promotions. If there is a '=' in the move or if the
     * destination row is not the last character in the move, then it may be a
     * pawn promotion.
     */
    ii = move.indexOf ('=');
    if (ii < 0) ii = toRowMarker;
    if ((ii > 0) && (ii < move.length - 1))
      if (mvPiece == 6)
        {
          var newPiece = move.charAt (ii + 1);

          if      (newPiece == PieceCode [1]) mvPieceOnTo = 2;
          else if (newPiece == PieceCode [2]) mvPieceOnTo = 3;
          else if (newPiece == PieceCode [3]) mvPieceOnTo = 4;
          else if (newPiece == PieceCode [4]) mvPieceOnTo = 5;

          mvIsPromotion = 1;
        }

    /*
     * Find which piece was captured. The first part checks normal captures.
     * If nothing is found then it has to be a pawn making an en-passant
     * capture.
     */
    if (mvCapture)
      {
        mvCapturedId = 15;
        while ((mvCapturedId >= 0) && (mvCaptured < 0))
          if ((PieceType [1 - MoveColor][mvCapturedId] >  0)       &&
              (PieceCol  [1 - MoveColor][mvCapturedId] == mvToCol) &&
              (PieceRow  [1 - MoveColor][mvCapturedId] == mvToRow))
            mvCaptured = PieceType [1 - MoveColor][mvCapturedId];
          else
            --mvCapturedId;

        if ((mvPiece == 6) && (mvCapturedId < 1) && (enPassant))
          {
            mvCapturedId = 15;
            while((mvCapturedId >= 0) && (mvCaptured < 0))
              if ((PieceType [1 - MoveColor][mvCapturedId] == 6)           &&
                  (PieceCol  [1 - MoveColor][mvCapturedId] ==     mvToCol) &&
                  (PieceRow  [1 - MoveColor][mvCapturedId] == 4 - MoveColor))
                mvCaptured = PieceType [1 - MoveColor][mvCapturedId];
              else
                --mvCapturedId;
          }
      }

    /*
     * Check the move legality.
     */
    var retVal;
    retVal = CheckLegality (PieceCode [mvPiece - 1], plyCount);
    if (!retVal) return false;

    /*
     * If a pawn was moved check if it enables the en-passant capture on next
     * move;
     */
    enPassant    = false;
    enPassantCol = -1;
    if ((mvPiece == 6) && (Math.abs (HistRow [0][plyCount] - mvToRow) == 2)) { enPassant = true; enPassantCol = mvToCol; }

    return true;
  }


/******************************************************************************
 *                                                                            *
 * Function PrintAdjudicateHTML:                                              *
 *                                                                            *
 ******************************************************************************/
function PrintAdjudicateHTML ()
  {
    var ii, jj;

    var text =
              '<TABLE BORDER = "0"  CELLSPACING = "2"  CELLPADDING = "5">' +
                '<TR>' +
                  '<TD ALIGN = "LEFT"></TD>' +
                  '<TR>' +
                    '<TD ALIGN = "CENTER">' +
                      '<DIV ID = "ShowLastMove"  CLASS = "Hide">Starting Position</DIV>' +
                    '</TD>' +
                    '<TD></TD>' +
                  '</TR>' +
                  '<TR>' +
                    '<TD valign = "TOP">' +
                      '<TABLE BORDER = "0"  CELLSPACING = "2"  CELLPADDING = "5">' +
                        '<TR>' +
                          '<TD ALIGN = "CENTER">' +
                            '<TABLE CELLSPACING = "2"  BORDER = "0"  ALIGN = "RIGHT"  CELLPADDING = "2"  BGCOLOR = "#FFFFFF">' +   // Border -> 0
                              '<TR>' +
                                '<TD ALIGN = "CENTER">' +
                                  '<TABLE WIDTH = "264"  CELLSPACING = "0"  CELLPADDING = "0"  BORDER = "2"  BORDERCOLOR = "#888888">';

    /*
     * Show the board as a 8x8 table.
     */
    for (ii = 0; ii < 8; ++ii)
      {
        text +=                     '<TR>';

        for (jj = 0; jj < 8; ++jj)
          {
            if ((ii + jj) % 2 == 0)
              text +=                 '<TD WIDTH = "33"  HEIGHT = "33"  BGCOLOR = "#FFFFFF"  style = "border:0">';
            else
              text +=                 '<TD WIDTH = "33"  HEIGHT = "33"  BGCOLOR = "#C0C0C0"  style = "border:0">';

            text +=                     '<IMG ALT = ""  WIDTH = "33"  HEIGHT = "33"  SRC = "./clear.gif">' +
                                      '</TD>';
          }

        text +=                     '</TR>';
      }

    /*
     * Buttons to move along the game.
     */
    text +=                       '</TABLE>' +
                                '</TD>' +
                                '<TD BORDER = "0"  style = "padding:0;"><IMG ID = "LabRt"  NAME = "RightLabels"  ALT = "" SRC = "./8_1.gif"></TD>' +
                              '</TR>' +
                              '<TR><TD BORDER = "0"><IMG ID = "LabBt"  NAME = "BottomLabels"  ALT = "" SRC = "./a_h.gif"></TD></TR>' +
                            '</TABLE>' +
                          '</TD>' +
                        '</TR>' +
                        '<TR>' +
                          '<TD>' +
                            '<FORM NAME = "BoardForm">' +
                              '<INPUT TYPE = "HIDDEN"  VALUE = ""  NAME = "CurrentPly">' +
                              '<INPUT TYPE = "HIDDEN"  VALUE = ""  NAME = "Position">' +
                              '<TABLE BORDER = 0  CELLPADDING = 1  CELLSPACING = 0>' +
                              '<TR>' +
                                '<TD>' +
                                  '<INPUT TYPE = "BUTTON"  VALUE = "I&lt;"  WIDTH = "21"  STYLE = "width:25"  ID = "btnInit"  onClick = "javascript:Init ()">' +
                                '</TD>' +
                                '<TD>' +
                                  '<INPUT TYPE = "BUTTON"  VALUE = "&lt;&lt;" WIDTH = "21"  STYLE = "width:25"  ID = "btnMB10"  onClick = "javascript:MoveBackward (10)">' +
                                '</TD>' +
                                '<TD>' +
                                  '<INPUT TYPE = "BUTTON"  VALUE = "&lt;"  WIDTH = "21"  STYLE = "width:25"  ID = "btnMB1"  onClick = "javascript:MoveBackward (1)">' +
                                '</TD>' +
                                '<TD>' +
                                  '<INPUT TYPE = "BUTTON"  VALUE = "&gt;"  WIDTH = "21"  STYLE = "width:25"  ID = "btnMF1"  onClick = "javascript:MoveForward (1)">' +
                                '</TD>' +
                                '<TD>' +
                                  '<INPUT TYPE = "BUTTON"  VALUE = "&gt;&gt;"  WIDTH = "21"  STYLE = "width:25"  ID = "btnMF10"  onClick = "javascript:MoveForward (10)">' +
                                '</TD>' +
                                '<TD>' +
                                  '<INPUT TYPE = "BUTTON"  VALUE = "&gt;I"  WIDTH = "21"  STYLE = "width:25"  ID = "btnMF1000"  onClick = "javascript:MoveForward (MaxMove)">' +
                                '</TD>' +
                                '<TD>' +
                                  '<INPUT TYPE = "BUTTON"  VALUE = "play"  WIDTH = "41"  STYLE = "width:42"  ID = "btnPlay" NAME = "AutoPlay"  onClick = "javascript:SwitchAutoPlay ()">' +
                                '</TD>' +
                                '<TD>' +
                                  '<SELECT NAME = "Delay"  onChange = "SetDelay (this.options [selectedIndex].value)"  SIZE = 1>' +
                                    '<OPTION VALUE = 1 selected>fast' +
                                    '<OPTION VALUE = 2>med. ' +
                                    '<OPTION VALUE = 3>slow' +
                                  '</SELECT>' +
                                '</TD>' +
                              '</TABLE>' +
                            '</FORM>' +
                          '</TR>' +
                        '<TR>' +
                        '<TD>' +
                          '<TABLE BORDER = 0  CELLPADDING = 1  CELLSPACING = 0>' +
                            '<TR>' +
                              '<TD>' +
                                '<INPUT TYPE = "BUTTON"  VALUE = "Flip Board"  ID = "btnFlip"  WIDTH = "100"  STYLE = "width:100"  onClick = "javascript:FlipBoard ()" />' +
                              '</TD>' +
                            '</TR>' +
                          '</TABLE>' +
                        '</TR>' +
                      '</TD>' +
                    '</TR>' +
                  '</TABLE>' +
                '</TD>';
              '</TD>'  +
            '</TR>'  +
          '</TABLE>';

    /*
     * Show the HTML
     */
    theObject = document.getElementById ("GameText");
    theObject.innerHTML = text;

    theObject = document.getElementById ("GameEval");
    theObject.innerHTML = GetShowPgnText ();
  }


function GetShowPgnText ()
  {
    var outtext = '<DIV ID = "ShowPgnText">'
                + '<INPUT type="hidden" name="id_user" value="' + id_user + '">'
		            + '<INPUT type="hidden" name="id_game" value="' + id_game + '">'
                + '<TABLE><tr><td /><td /><td /><td>PS</td><td>PE</td><td>Bl</td><td>Cv</td><td>Df</td><td>Ca</td></tr><tr style="height:1pt;">';

    for (ii = StartPly; ii <= StartPly + PlyNumber; ++ii)
      {
        if (ii % 2 == 0)
          {
            var moveCount = Math.floor (ii / 2);

            if (ii != 0)
              {
                outtext += '<TD><INPUT TYPE = "checkbox"  NAME = "MoveEvalPS' + moveCount + '"  ID = "chkPS' + moveCount + '"  WIDTH = "20"  STYLE = "width:20"  onChange = "javascript:togglePlanStart   (' + moveCount + ');" /></TD>';
                outtext += '<TD><INPUT TYPE = "checkbox"  NAME = "MoveEvalPE' + moveCount + '"  ID = "chkPE' + moveCount + '"  WIDTH = "20"  STYLE = "width:20"  onChange = "javascript:togglePlanEnd     (' + moveCount + ');" /></TD>';
                outtext += '<TD><INPUT TYPE = "checkbox"  NAME = "MoveEvalBl' + moveCount + '"  ID = "chkBl' + moveCount + '"  WIDTH = "20"  STYLE = "width:20"  onChange = "javascript:toggleBlunder     (' + moveCount + ');" /></TD>';
                outtext += '<TD><INPUT TYPE = "checkbox"  NAME = "MoveEvalCv' + moveCount + '"  ID = "chkCv' + moveCount + '"  WIDTH = "20"  STYLE = "width:20"  onChange = "javascript:toggleCreative    (' + moveCount + ');" /></TD>';
                outtext += '<TD><INPUT TYPE = "checkbox"  NAME = "MoveEvalDf' + moveCount + '"  ID = "chkDf' + moveCount + '"  WIDTH = "20"  STYLE = "width:20"  onChange = "javascript:toggleDifficult   (' + moveCount + ');" /></TD>';
                outtext += '<TD><INPUT TYPE = "checkbox"  NAME = "MoveEvalCa' + moveCount + '"  ID = "chkCa' + moveCount + '"  WIDTH = "20"  STYLE = "width:20"  onChange = "javascript:toggleCalculating (' + moveCount + ');" /></TD>';
                outtext += '</tr>';
              }

            if (ii < StartPly + PlyNumber)
              {
                outtext +='<tr style="height:1pt;"><td>' + (moveCount + 1) + '. </td>';
              }
          }

        if (ii < StartPly + PlyNumber)
          {
            jj = ii + 1;
            outtext += ' <td><A HREF = "javascript:GoToMove (' + jj + ')"  CLASS = "move"  ID = "Mv' + jj + '">' + Moves [ii] + '</A></td> ';
          }
      }

    outtext += '</tr></table><br /> (' + gameLongResult + ')'+ '<TR>' + '<td><INPUT type = "submit"  name = "submit"  value = "Submit" /></td>' + '</TR>' + '</DIV>';

    return outtext;
  }

  
function togglePlanStart   (moveCount)  { MoveEvalPlanStart   [moveCount] = !MoveEvalPlanStart   [moveCount]; }
function togglePlanEnd     (moveCount)  { MoveEvalPlanEnd     [moveCount] = !MoveEvalPlanEnd     [moveCount]; }
function toggleBlunder     (moveCount)  { MoveEvalBlunder     [moveCount] = !MoveEvalBlunder     [moveCount]; }
function toggleCreative    (moveCount)  { MoveEvalCreative    [moveCount] = !MoveEvalCreative    [moveCount]; }
function toggleDifficult   (moveCount)  { MoveEvalDifficult   [moveCount] = !MoveEvalDifficult   [moveCount]; }
function toggleCalculating (moveCount)  { MoveEvalCalculating [moveCount] = !MoveEvalCalculating [moveCount]; }


function FlipBoard ()
  {
    IsRotated = !IsRotated;
    RefreshBoard ();
  }


/******************************************************************************
 *                                                                            *
 * Function RefreshBoard:                                                     *
 *                                                                            *
 * Update the images of all pieces on the board.                              *
 *                                                                            *
 ******************************************************************************/
function RefreshBoard ()
  {
    /*
     * Display all empty squares.
     */
    var col, row;
    for (col = 0; col < 8; ++col)
      for (row = 0; row < 8; ++row)
        if (Board [col][row] == 0)
          {
            var square;
            if (IsRotated) square = 63 - col - (7 - row) * 8;
            else           square =      col + (7 - row) * 8;

            SetImage (square, ClearImg.src);
          }

    /*
     * Display all pieces.
     */
    var color, ii;
    for (color = 0; color < 2; ++color)
      for (ii = 0; ii < 16; ++ii)
        if (PieceType [color][ii] > 0)
          {
            var square;
            if (IsRotated) square = 63 - PieceCol [color][ii] - (7 - PieceRow [color][ii]) * 8;
            else           square =      PieceCol [color][ii] + (7 - PieceRow [color][ii]) * 8;

            SetImage (square, PiecePicture [color][PieceType [color][ii]].src);
          }

    /*
     * Display coordinates
     */
    var NumCoordBarObject    = document.getElementById ("LabRt");
    var LetterCoordBarObject = document.getElementById ("LabBt");

    if (IsRotated)
      {
        NumCoordBarObject.src    = LabelPic [2].src;
        LetterCoordBarObject.src = LabelPic [3].src;
      }
    else
      {
        NumCoordBarObject.src    = LabelPic [0].src;
        LetterCoordBarObject.src = LabelPic [1].src;
      }
  }


/******************************************************************************
 *                                                                            *
 * Function SetAutoPlay:                                                      *
 *                                                                            *
 * Start the autoplay or stop it depending on the user input.                 *
 *                                                                            *
 ******************************************************************************/
function SetAutoPlay (vv)
  {
    isAutoPlayOn = vv;

    /*
     * No matter what clear the timeout.
     */
    if (AutoPlayInterval) clearTimeout (AutoPlayInterval);

    /*
     * If switched on start  moving forward. Also change the button value.
     */
    if (isAutoPlayOn)
      {
        if  ((document.BoardForm) && (document.BoardForm.AutoPlay)) document.BoardForm.AutoPlay.value = "stop";
        MoveForward (1);
      }
    else if ((document.BoardForm) && (document.BoardForm.AutoPlay)) document.BoardForm.AutoPlay.value = "play";
  }


/******************************************************************************
 *                                                                            *
 * Function SetDelay:                                                         *
 *                                                                            *
 * Change the delay of autplay.                                               *
 *                                                                            *
 ******************************************************************************/
function SetDelay (vv) { Delay = vv; }


/******************************************************************************
 *                                                                            *
 * Function SetDelayValue:                                                    *
 *                                                                            *
 * Change the delay of autplay.                                               *
 * xxxx                                                                       *
 ******************************************************************************/
function SetDelayValue ()
  {
    if (Delay == 1) return 1000;
    if (Delay == 2) return 2000;
    if (Delay == 3) return 3000;

    return 4000;
  }


/******************************************************************************
 *                                                                            *
 * Function SetImage:                                                         *
 *                                                                            *
 * Given a square and an image show it on the board. To make it faster check  *
 * if the image corresponds to the one already there and update it only if    *
 * necessary.                                                                 *
 *                                                                            *
 ******************************************************************************/
function SetImage (square, image)
  {
    if (DocumentImages [square] == image) return;

    DocumentImages  [square] = document.images [square].src = image;  // Store the new image.
  }


/******************************************************************************
 *                                                                            *
 * Function SwitchAutoplay:                                                   *
 *                                                                            *
 * Receive user enable/disable autoplay.                                      *
 *                                                                            *
 ******************************************************************************/
function SwitchAutoPlay () { SetAutoPlay (!isAutoPlayOn); }


/******************************************************************************
 *                                                                            *
 * Function StoreMove:                                                        *
 *                                                                            *
 * Update the Board array describing the position of each piece, and the      *
 * "History" arrays describing the movement of the pieces during the game.    *
 *                                                                            *
 ******************************************************************************/
function StoreMove (thisPly)
  {
    /*
     * Store the moved piece int he history arrays.
     */
    HistPieceId [0][thisPly] = mvPieceId;
    HistCol     [0][thisPly] = PieceCol  [MoveColor][mvPieceId];
    HistRow     [0][thisPly] = PieceRow  [MoveColor][mvPieceId];
    HistType    [0][thisPly] = PieceType [MoveColor][mvPieceId];

    if (mvIsCastling)
      {
        HistPieceId [1][thisPly] = castleRook;
        HistCol     [1][thisPly] = PieceCol  [MoveColor][castleRook];
        HistRow     [1][thisPly] = PieceRow  [MoveColor][castleRook];
        HistType    [1][thisPly] = PieceType [MoveColor][castleRook];
      }

    else if (mvCapturedId >= 0)
      {
        HistPieceId [1][thisPly] = mvCapturedId + 16;
        HistCol     [1][thisPly] = PieceCol  [1 - MoveColor][mvCapturedId];
        HistRow     [1][thisPly] = PieceRow  [1 - MoveColor][mvCapturedId];
        HistType    [1][thisPly] = PieceType [1 - MoveColor][mvCapturedId];
      }

    else HistPieceId [1][thisPly] = -1;

    /*
     * Update the from square and the captured square. Remember that the
     * captured square is not necessarely the to square because of the en-passant.
     */
    Board [PieceCol [MoveColor][mvPieceId]][PieceRow [MoveColor][mvPieceId]] = 0;

    /*
     * Mark the captured piece as such.
     */
    if (mvCapturedId >= 0)
      {
        PieceType [1 - MoveColor][mvCapturedId] = -1;
        PieceMoveCounter [1 - MoveColor][mvCapturedId]++;
        Board [PieceCol [1 - MoveColor][mvCapturedId]][PieceRow [1 - MoveColor][mvCapturedId]] = 0;
      }

    /*
     * Update the piece arrays. Don't forget to update the type array, since a
     * pawn might have been replaced by a piece in a promotion.
     *
     */
    PieceType        [MoveColor][mvPieceId] = mvPieceOnTo;
    PieceMoveCounter [MoveColor][mvPieceId]++;
    PieceCol         [MoveColor][mvPieceId] = mvToCol;
    PieceRow         [MoveColor][mvPieceId] = mvToRow;

    if (mvIsCastling)
      {
        PieceMoveCounter [MoveColor][castleRook]++;
        if (mvToCol == 2) PieceCol [MoveColor][castleRook] = 3;
        else              PieceCol [MoveColor][castleRook] = 5;

        PieceRow [MoveColor][castleRook] = mvToRow;
      }

    /*
     * Update the board.
     */
    Board [mvToCol][mvToRow] = PieceType [MoveColor][mvPieceId] * (1 - 2 * MoveColor);
    if (mvIsCastling)
      Board [PieceCol [MoveColor][castleRook]][PieceRow [MoveColor][castleRook]] = PieceType [MoveColor][castleRook] * (1 - 2 * MoveColor);

    return;
  }


function Color (nn)
  {
    if (nn < 0) return 1;
    if (nn > 0) return 0;

    return 2;
  }


function sign (nn)
  {
    if (nn > 0) return  1;
    if (nn < 0) return -1;

    return 0;
  }


function SquareOnBoard (col, row)
  {
    if ((col < 0) || (col > 7)) return false;
    if ((row < 0) || (row > 7)) return false;

    return true;
  }
