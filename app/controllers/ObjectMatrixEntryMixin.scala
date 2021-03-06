package controllers

import helpers.{MetadataHelper, RangeHeader}
import models.ObjectMatrixEntry
import org.slf4j.Logger

import scala.util.Try

trait ObjectMatrixEntryMixin {
  protected val logger:Logger

  /**
    * gathers appropriate headers for the given [[ObjectMatrixEntry]]
    * @param entry [[ObjectMatrixEntry]] instance
    * @return
    */
  def headersForEntry(entry:ObjectMatrixEntry, ranges:Seq[RangeHeader], totalSize:Option[Long]):Map[String,String] = {
    logger.info(entry.attributes.toString)
    val contentRangeHeader = ranges.headOption.map(range=>s"bytes ${range.headerString}${totalSize.map(s=>s"/$s").getOrElse("")}")

    val optionalFields = Seq(
      contentRangeHeader.map(hdr=>"Content-Range"->hdr),
      entry.attributes.flatMap(_.stringValues.get("MXFS_FILENAME")).map(filename=>"Content-Disposition"->s"filename=${java.net.URLEncoder.encode(filename, "utf-8")}")
    ).collect({case Some(field)=>field})


    optionalFields.toMap ++ Map(
      "Accept-Ranges"->"bytes",
    )
  }
}
