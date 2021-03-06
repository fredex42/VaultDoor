package models
import java.time.{Instant, ZoneId, ZonedDateTime}

import com.om.mxs.client.japi.MXFSFileAttributes

case class FileAttributes(fileKey:String, name:String, parent:Option[String], isDir:Boolean, isOther:Boolean, isRegular:Boolean, isSymlink:Boolean, ctime:ZonedDateTime, mtime:ZonedDateTime, atime:ZonedDateTime, size:Long)

object FileAttributes {
  def apply(from:MXFSFileAttributes) = new FileAttributes(
    from.fileKey().toString,
    from.getName,
    Option(from.getParent),
    from.isDirectory,
    from.isOther,
    from.isRegularFile,
    from.isSymbolicLink,
    ZonedDateTime.ofInstant(Instant.ofEpochMilli(from.creationTime()), ZoneId.systemDefault()),
    ZonedDateTime.ofInstant(Instant.ofEpochMilli(from.lastModifiedTime()), ZoneId.systemDefault()),
    ZonedDateTime.ofInstant(Instant.ofEpochMilli(from.lastAccessTime()), ZoneId.systemDefault()),
    from.size()
  )
}
